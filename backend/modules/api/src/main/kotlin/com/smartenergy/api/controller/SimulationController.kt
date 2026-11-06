package com.smartenergy.api.controller

import com.smartenergy.api.simulation.MeasurementSimulationService
import com.smartenergy.api.simulation.SimulationStatus
import com.smartenergy.api.simulation.SimulationUpdateRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/simulation")
@Tag(name = "Simulation", description = "Live measurement simulation for active sensors")
class SimulationController(private val simulationService: MeasurementSimulationService) {
    @GetMapping
    @Operation(summary = "Read whether the live measurement simulation is running")
    fun status(): SimulationStatus = simulationService.status()

    @PutMapping
    @Operation(summary = "Start or stop the live measurement simulation")
    fun update(@Valid @RequestBody request: SimulationUpdateRequest): SimulationStatus =
        simulationService.setRunning(request.running)
}
