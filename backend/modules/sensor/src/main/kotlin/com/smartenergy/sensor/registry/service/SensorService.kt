package com.smartenergy.sensor.registry.service

import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.dto.SensorRequest
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.model.Sensor
import com.smartenergy.sensor.registry.repository.SensorRepository
import org.springframework.stereotype.Service

@Service
class SensorService(
    private val repository: SensorRepository,
    private val buildingService: BuildingService
) {

    fun findAll(buildingId: String? = null): List<SensorResponse> {
        val sensors = buildingId?.let(repository::findAllByBuildingId) ?: repository.findAll()
        return sensors.map { it.toResponse() }
    }

    fun findById(id: String): SensorResponse = findEntity(id).toResponse()

    fun create(request: SensorRequest): SensorResponse {
        buildingService.findById(request.buildingId)
        return repository.save(request.toSensor()).toResponse()
    }

    fun update(id: String, request: SensorRequest): SensorResponse {
        val existing = findEntity(id)
        buildingService.findById(request.buildingId)
        return repository.save(
            request.toSensor(id = id, createdAt = existing.createdAt)
        ).toResponse()
    }

    fun updateStatus(id: String, status: String): SensorResponse {
        val existing = findEntity(id)
        return repository.save(existing.copy(status = status)).toResponse()
    }

    fun delete(id: String) {
        findEntity(id)
        repository.deleteById(id)
    }

    fun hasSensorsForBuilding(buildingId: String): Boolean = repository.existsByBuildingId(buildingId)

    private fun findEntity(id: String): Sensor = repository.findById(id)
        .orElseThrow { ResourceNotFoundException("Sensor", id) }

    private fun SensorRequest.toSensor(id: String? = null, createdAt: java.time.Instant = java.time.Instant.now()) = Sensor(
        id = id,
        name = name.trim(),
        type = type,
        buildingId = buildingId,
        status = status,
        consumptionThreshold = consumptionThreshold,
        createdAt = createdAt
    )

    private fun Sensor.toResponse() = SensorResponse(
        id = requireNotNull(id),
        name = name,
        type = type,
        buildingId = buildingId,
        status = status,
        consumptionThreshold = consumptionThreshold,
        createdAt = createdAt
    )
}