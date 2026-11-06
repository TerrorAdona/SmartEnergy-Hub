package com.smartenergy.equipment.building.service

import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.equipment.building.dto.BuildingRequest
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.model.Building
import com.smartenergy.equipment.building.repository.BuildingRepository
import org.springframework.stereotype.Service

@Service
class BuildingService(private val repository: BuildingRepository) {

    fun findAll(): List<BuildingResponse> = repository.findAll().map { it.toResponse() }

    fun findById(id: String): BuildingResponse = findEntity(id).toResponse()

    fun create(request: BuildingRequest): BuildingResponse = repository.save(
        Building(
            name = request.name.trim(),
            location = request.location.trim(),
            description = request.description?.trim()?.takeIf(String::isNotEmpty)
        )
    ).toResponse()

    fun update(id: String, request: BuildingRequest): BuildingResponse {
        val existing = findEntity(id)
        return repository.save(
            existing.copy(
                name = request.name.trim(),
                location = request.location.trim(),
                description = request.description?.trim()?.takeIf(String::isNotEmpty)
            )
        ).toResponse()
    }

    fun delete(id: String) {
        findEntity(id)
        repository.deleteById(id)
    }

    private fun findEntity(id: String): Building = repository.findById(id)
        .orElseThrow { ResourceNotFoundException("Building", id) }

    private fun Building.toResponse(): BuildingResponse = BuildingResponse(
        id = requireNotNull(id),
        name = name,
        location = location,
        description = description,
        createdAt = createdAt
    )
}