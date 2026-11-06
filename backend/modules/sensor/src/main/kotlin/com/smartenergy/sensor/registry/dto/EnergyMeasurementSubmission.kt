package com.smartenergy.sensor.registry.dto

import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PastOrPresent
import java.time.Instant
import java.util.UUID

data class EnergyMeasurementSubmission(
    val measurementId: UUID = UUID.randomUUID(),
    @field:NotBlank val sensorId: String,
    @field:PastOrPresent val timestamp: Instant,
    @field:DecimalMin("-100000.0")
    @field:DecimalMax("100000.0")
    val powerKw: Double,
    @field:DecimalMin("0.0")
    @field:DecimalMax("1000.0")
    val voltage: Double,
    @field:DecimalMin("-80.0")
    @field:DecimalMax("150.0")
    val temperature: Double
)