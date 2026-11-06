package com.smartenergy.api.controller

import com.smartenergy.core.exception.SmartEnergyException
import com.smartenergy.equipment.building.dto.BuildingRequest
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.service.SensorService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/buildings")
class BuildingController(
    private val buildingService: BuildingService,
    private val sensorService: SensorService
) {
    @GetMapping
    fun findAll(): List<BuildingResponse> = buildingService.findAll()

    @GetMapping("/{id}")
    fun findById(@PathVariable id: String): BuildingResponse = buildingService.findById(id)

    @PostMapping
    fun create(@Valid @RequestBody request: BuildingRequest): ResponseEntity<BuildingResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(buildingService.create(request))

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @Valid @RequestBody request: BuildingRequest): BuildingResponse =
        buildingService.update(id, request)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: String): ResponseEntity<Void> {
        if (sensorService.hasSensorsForBuilding(id)) {
            throw SmartEnergyException(
                "Building $id still has associated sensors",
                "RESOURCE_IN_USE",
                HttpStatus.CONFLICT
            )
        }
        buildingService.delete(id)
        return ResponseEntity.noContent().build()
    }
}