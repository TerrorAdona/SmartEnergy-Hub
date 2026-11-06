package com.smartenergy.analytics.service

import com.smartenergy.analytics.dto.AggregationInterval
import com.smartenergy.analytics.dto.AnalyticsSummary
import com.smartenergy.analytics.dto.EnergyBucket
import com.smartenergy.analytics.dto.EntityEnergySummary
import com.smartenergy.analytics.dto.PeriodComparison
import com.smartenergy.core.exception.ValidationException
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.measurement.service.MeasurementHistoryService
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit
import kotlin.math.abs

@Service
class AnalyticsService(
    private val measurementHistoryService: MeasurementHistoryService,
    private val sensorService: SensorService,
    private val buildingService: BuildingService,
    @Value("\${app.analytics.max-sample-gap:5m}") private val maxSampleGap: Duration
) {
    fun summarize(
        from: Instant,
        to: Instant,
        interval: AggregationInterval,
        compareFrom: Instant? = null,
        compareTo: Instant? = null
    ): AnalyticsSummary {
        validateRange(from, to)
        if ((compareFrom == null) != (compareTo == null)) {
            throw ValidationException("Both comparison period boundaries are required")
        }
        if (compareFrom != null && compareTo != null) validateRange(compareFrom, compareTo)

        val buildings = buildingService.findAll()
        val sensors = sensorService.findAll()
        val measurements = loadMeasurements(sensors, from, to)
        val current = aggregate(sensors, buildings.associate { it.id to it.name }, measurements, interval)
        val comparison = if (compareFrom != null && compareTo != null) {
            val previousMeasurements = loadMeasurements(sensors, compareFrom, compareTo)
            val previousEnergy = aggregate(
                sensors,
                buildings.associate { it.id to it.name },
                previousMeasurements,
                interval
            ).totalEnergyKwh
            val currentEnergy = current.totalEnergyKwh
            PeriodComparison(
                currentEnergyKwh = currentEnergy,
                previousEnergyKwh = previousEnergy,
                changePercent = if (currentEnergy == null || previousEnergy == null || previousEnergy == 0.0) null
                else (currentEnergy - previousEnergy) / abs(previousEnergy) * 100.0
            )
        } else null

        val sensorNames = sensors.associateBy(SensorResponse::id)
        val recentMeasurements = measurements.sortedByDescending(EnergyMeasurementResponse::timestamp).take(10)
        return AnalyticsSummary(
            from = from,
            to = to,
            interval = interval,
            buildingCount = buildings.size,
            activeSensorCount = sensors.count { it.status == "ACTIVE" },
            totalEnergyKwh = current.totalEnergyKwh,
            averagePowerKw = current.averagePowerKw,
            timeline = current.timeline,
            byBuilding = current.byBuilding,
            bySensor = current.bySensor.map { summary ->
                summary.copy(name = sensorNames[summary.id]?.name ?: summary.name)
            },
            comparison = comparison,
            recentMeasurements = recentMeasurements
        )
    }

    private fun loadMeasurements(sensors: List<SensorResponse>, from: Instant, to: Instant) =
        sensors.flatMap { measurementHistoryService.findHistory(it.id, from, to) }

    private fun validateRange(from: Instant, to: Instant) {
        if (from.isAfter(to)) throw ValidationException("The start time must be before the end time")
        if (Duration.between(from, to) > MAX_RANGE) {
            throw ValidationException("Analytics range is limited to 30 days")
        }
    }

    private fun aggregate(
        sensors: List<SensorResponse>,
        buildingNames: Map<String, String>,
        measurements: List<EnergyMeasurementResponse>,
        interval: AggregationInterval
    ): AggregateResult {
        val sensorsById = sensors.associateBy(SensorResponse::id)
        val total = MetricAccumulator()
        val bySensor = mutableMapOf<String, MetricAccumulator>()
        val byBuilding = mutableMapOf<String, MetricAccumulator>()
        val byBucket = mutableMapOf<Instant, MetricAccumulator>()

        measurements.forEach { measurement ->
            val sensor = sensorsById[measurement.sensorId] ?: return@forEach
            bySensor.getOrPut(sensor.id, ::MetricAccumulator).measurementCount++
            byBuilding.getOrPut(sensor.buildingId, ::MetricAccumulator).measurementCount++
            byBucket.getOrPut(bucketStart(measurement.timestamp, interval), ::MetricAccumulator).measurementCount++
        }

        measurements.groupBy(EnergyMeasurementResponse::sensorId).forEach { (sensorId, readings) ->
            val sensor = sensorsById[sensorId] ?: return@forEach
            val ordered = readings.sortedBy(EnergyMeasurementResponse::timestamp)
            ordered.zipWithNext().forEach inner@{ (left, right) ->
                val duration = Duration.between(left.timestamp, right.timestamp)
                if (duration.isZero || duration.isNegative || duration > maxSampleGap) return@inner
                val end = right.timestamp
                val fullMillis = duration.toMillis().toDouble()
                var cursor = left.timestamp
                while (cursor.isBefore(end)) {
                    val bucket = bucketStart(cursor, interval)
                    val segmentEnd = minOf(end, bucketEnd(bucket, interval))
                    val startFraction = Duration.between(left.timestamp, cursor).toMillis() / fullMillis
                    val endFraction = Duration.between(left.timestamp, segmentEnd).toMillis() / fullMillis
                    val startPower = interpolate(left.powerKw, right.powerKw, startFraction)
                    val endPower = interpolate(left.powerKw, right.powerKw, endFraction)
                    val hours = Duration.between(cursor, segmentEnd).toMillis() / 3_600_000.0
                    val energy = (startPower + endPower) / 2.0 * hours

                    total.add(energy, hours)
                    bySensor.getOrPut(sensor.id, ::MetricAccumulator).add(energy, hours)
                    byBuilding.getOrPut(sensor.buildingId, ::MetricAccumulator).add(energy, hours)
                    byBucket.getOrPut(bucket, ::MetricAccumulator).add(energy, hours)
                    cursor = segmentEnd
                }
            }
        }

        return AggregateResult(
            totalEnergyKwh = total.energyKwhIfObserved,
            averagePowerKw = total.averagePowerKw,
            timeline = byBucket.map { (bucket, metrics) ->
                EnergyBucket(bucket, metrics.energyKwhIfObserved, metrics.averagePowerKw, metrics.measurementCount)
            }.sortedBy(EnergyBucket::bucketStart),
            byBuilding = byBuilding.map { (id, metrics) ->
                EntityEnergySummary(id, buildingNames[id] ?: id, metrics.energyKwhIfObserved, metrics.averagePowerKw, metrics.measurementCount)
            }.sortedByDescending(EntityEnergySummary::energyKwh),
            bySensor = bySensor.map { (id, metrics) ->
                EntityEnergySummary(id, id, metrics.energyKwhIfObserved, metrics.averagePowerKw, metrics.measurementCount)
            }.sortedByDescending(EntityEnergySummary::energyKwh)
        )
    }

    private fun bucketStart(timestamp: Instant, interval: AggregationInterval): Instant {
        val utc = timestamp.atZone(ZoneOffset.UTC)
        return when (interval) {
            AggregationInterval.HOUR -> timestamp.truncatedTo(ChronoUnit.HOURS)
            AggregationInterval.DAY -> utc.toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant()
            AggregationInterval.MONTH -> utc.withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant()
        }
    }

    private fun bucketEnd(bucket: Instant, interval: AggregationInterval): Instant = when (interval) {
        AggregationInterval.HOUR -> bucket.plus(1, ChronoUnit.HOURS)
        AggregationInterval.DAY -> bucket.plus(1, ChronoUnit.DAYS)
        AggregationInterval.MONTH -> bucket.atZone(ZoneOffset.UTC).plusMonths(1).toInstant()
    }

    private fun interpolate(start: Double, end: Double, fraction: Double) = start + (end - start) * fraction

    private data class AggregateResult(
        val totalEnergyKwh: Double?,
        val averagePowerKw: Double?,
        val timeline: List<EnergyBucket>,
        val byBuilding: List<EntityEnergySummary>,
        val bySensor: List<EntityEnergySummary>
    )

    private class MetricAccumulator {
        var energyKwh = 0.0
        var observedHours = 0.0
        var measurementCount = 0
        val energyKwhIfObserved: Double?
            get() = if (observedHours > 0) energyKwh else null
        val averagePowerKw: Double?
            get() = if (observedHours > 0) energyKwh / observedHours else null

        fun add(energy: Double, hours: Double) {
            energyKwh += energy
            observedHours += hours
        }
    }

    private companion object {
        val MAX_RANGE: Duration = Duration.ofDays(30)
    }
}