package com.smartenergy.measurement.service

import com.smartenergy.core.exception.ValidationException
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.measurement.model.EnergyMeasurement
import com.smartenergy.measurement.model.EnergyMeasurementKey
import com.smartenergy.measurement.repository.EnergyMeasurementRepository
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class MeasurementHistoryService(private val repository: EnergyMeasurementRepository) {
    fun findHistory(sensorId: String, from: Instant, to: Instant): List<EnergyMeasurementResponse> {
        if (from.isAfter(to)) throw ValidationException("The start time must be before the end time")
        if (Duration.between(from, to) > MAX_RANGE) {
            throw ValidationException("Measurement history is limited to 30 days")
        }

        val results = mutableListOf<EnergyMeasurementResponse>()
        var bucketDay = from.truncatedTo(ChronoUnit.DAYS)
        val lastBucketDay = to.truncatedTo(ChronoUnit.DAYS)
        while (!bucketDay.isAfter(lastBucketDay)) {
            repository.findDayRange(sensorId, bucketDay, from, to)
                .mapTo(results) { it.toResponse() }
            bucketDay = bucketDay.plus(1, ChronoUnit.DAYS)
        }
        return results.sortedByDescending(EnergyMeasurementResponse::timestamp)
    }

    private fun EnergyMeasurement.toResponse() = EnergyMeasurementResponse(
        measurementId = key.measurementId,
        sensorId = key.sensorId,
        timestamp = key.timestamp,
        powerKw = powerKw,
        voltage = voltage,
        temperature = temperature
    )

    private companion object {
        val MAX_RANGE: Duration = Duration.ofDays(30)
    }
}