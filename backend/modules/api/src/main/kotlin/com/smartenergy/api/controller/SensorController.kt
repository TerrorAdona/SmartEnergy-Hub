package com.smartenergy.api.controller

import com.smartenergy.sensor.registry.dto.SensorRequest
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.dto.SensorStatusRequest
import com.smartenergy.sensor.registry.service.SensorService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/sensors")
@Tag(name = "Sensors", description = "Sensor registry and lifecycle")
class SensorController(private val sensorService: SensorService) {
    @GetMapping
    @Operation(summary = "List sensors, optionally filtered by building")
    fun findAll(@RequestParam(required = false) buildingId: String?): List<SensorResponse> =
        sensorService.findAll(buildingId)

    @GetMapping("/{id}")
    @Operation(summary = "Get a sensor")
    fun findById(@PathVariable id: String): SensorResponse = sensorService.findById(id)

    @PostMapping
    @Operation(summary = "Register a sensor")
    fun create(@Valid @RequestBody request: SensorRequest): ResponseEntity<SensorResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(sensorService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update sensor details, status and threshold")
    fun update(@PathVariable id: String, @Valid @RequestBody request: SensorRequest): SensorResponse =
        sensorService.update(id, request)

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate or deactivate a sensor")
    fun updateStatus(
        @PathVariable id: String,
        @Valid @RequestBody request: SensorStatusRequest
    ): SensorResponse = sensorService.updateStatus(id, request.status)

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a sensor")
    fun delete(@PathVariable id: String): ResponseEntity<Void> {
        sensorService.delete(id)
        return ResponseEntity.noContent().build()
    }
}