package com.smartenergy.analytics.alert.service

import com.smartenergy.analytics.alert.dto.EnergyAlertResponse
import com.smartenergy.analytics.alert.model.EnergyAlert
import com.smartenergy.analytics.alert.repository.EnergyAlertRepository
import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.core.exception.ValidationException
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.slf4j.LoggerFactory
import org.springframework.dao.DuplicateKeyException
import org.springframework.data.domain.Sort
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.query.Criteria
import org.springframework.data.mongodb.core.query.Query
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class EnergyAlertService(
    private val repository: EnergyAlertRepository,
    private val mongoTemplate: MongoTemplate,
    private val sensorService: SensorService,
    private val buildingService: BuildingService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun detectPowerThreshold(measurement: EnergyMeasurementSubmission, sensor: SensorResponse): Boolean {
        val threshold = sensor.consumptionThreshold.toDouble()
        if (measurement.powerKw <= threshold || repository.existsByMeasurementId(measurement.measurementId)) {
            return false
        }

        return try {
            repository.save(
                EnergyAlert(
                    measurementId = measurement.measurementId,
                    sensorId = sensor.id,
                    buildingId = sensor.buildingId,
                    type = EnergyAlert.POWER_THRESHOLD,
                    observedValue = measurement.powerKw,
                    threshold = threshold,
                    createdAt = Instant.now()
                )
            )
            logger.info(
                "Raised {} alert for sensor {} measurement {} observed={} threshold={}",
                EnergyAlert.POWER_THRESHOLD,
                sensor.id,
                measurement.measurementId,
                measurement.powerKw,
                threshold
            )
            true
        } catch (_: DuplicateKeyException) {
            false
        }
    }

    fun findAlerts(
        status: String? = null,
        type: String? = null,
        sensorId: String? = null,
        buildingId: String? = null,
        from: Instant? = null,
        to: Instant? = null,
        limit: Int = 100
    ): List<EnergyAlertResponse> {
        if (limit !in 1..500) throw ValidationException("Alert limit must be between 1 and 500")
        if (from != null && to != null && from.isAfter(to)) {
            throw ValidationException("The start time must be before the end time")
        }

        val criteria = mutableListOf<Criteria>()
        status?.let { criteria += Criteria.where("status").`is`(it) }
        type?.let { criteria += Criteria.where("type").`is`(it) }
        sensorId?.let { criteria += Criteria.where("sensorId").`is`(it) }
        buildingId?.let { criteria += Criteria.where("buildingId").`is`(it) }
        if (from != null || to != null) {
            val dateCriteria = Criteria.where("createdAt")
            if (from != null) dateCriteria.gte(from)
            if (to != null) dateCriteria.lte(to)
            criteria += dateCriteria
        }

        val query = Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(limit)
        when (criteria.size) {
            1 -> query.addCriteria(criteria.single())
            in 2..Int.MAX_VALUE -> query.addCriteria(Criteria().andOperator(*criteria.toTypedArray()))
        }
        return toResponses(mongoTemplate.find(query, EnergyAlert::class.java))
    }

    fun acknowledge(id: String, acknowledgedBy: String): EnergyAlertResponse {
        val alert = repository.findById(id).orElseThrow { ResourceNotFoundException("Alert", id) }
        val updated = if (alert.status == EnergyAlert.ACTIVE) {
            repository.save(
                alert.copy(
                    status = EnergyAlert.ACKNOWLEDGED,
                    acknowledgedAt = Instant.now(),
                    acknowledgedBy = acknowledgedBy.trim().ifBlank { "operator" }
                )
            )
        } else alert
        return toResponses(listOf(updated)).single()
    }

    fun createFromStream(measurement: EnergyMeasurementSubmission): Boolean {
        val sensor = try {
            sensorService.findById(measurement.sensorId)
        } catch (_: ResourceNotFoundException) {
            return false
        }
        if (sensor.status != "ACTIVE") return false
        return detectPowerThreshold(measurement, sensor)
    }

    private fun toResponses(alerts: List<EnergyAlert>): List<EnergyAlertResponse> {
        if (alerts.isEmpty()) return emptyList()
        val sensors = sensorService.findAll().associateBy(SensorResponse::id)
        val buildings = buildingService.findAll().associateBy { it.id }
        return alerts.map { alert ->
            EnergyAlertResponse(
                id = alert.id,
                measurementId = alert.measurementId,
                sensorId = alert.sensorId,
                sensorName = sensors[alert.sensorId]?.name ?: alert.sensorId,
                buildingId = alert.buildingId,
                buildingName = buildings[alert.buildingId]?.name ?: alert.buildingId,
                type = alert.type,
                observedValue = alert.observedValue,
                threshold = alert.threshold,
                createdAt = alert.createdAt,
                status = alert.status,
                acknowledgedAt = alert.acknowledgedAt,
                acknowledgedBy = alert.acknowledgedBy
            )
        }
    }
}