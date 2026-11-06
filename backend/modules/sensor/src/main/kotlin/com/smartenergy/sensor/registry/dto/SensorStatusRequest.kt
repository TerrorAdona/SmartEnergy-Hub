package com.smartenergy.sensor.registry.dto

import jakarta.validation.constraints.Pattern

data class SensorStatusRequest(
    @field:Pattern(regexp = "ACTIVE|INACTIVE")
    val status: String
)