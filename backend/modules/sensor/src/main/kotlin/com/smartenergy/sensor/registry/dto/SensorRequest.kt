package com.smartenergy.sensor.registry.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.math.BigDecimal

data class SensorRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val name: String,
    @field:Pattern(
        regexp = "TEMPERATURE|HUMIDITY|POWER|VOLTAGE|CURRENT|ENERGY|FREQUENCY|POWER_FACTOR|IRRADIANCE|WIND_SPEED|PRESSURE|FLOW|LEVEL|GENERIC"
    )
    val type: String,
    @field:NotBlank
    val buildingId: String,
    @field:Pattern(regexp = "ACTIVE|INACTIVE")
    val status: String = "ACTIVE",
    @field:DecimalMin(value = "0.0", inclusive = true)
    val consumptionThreshold: BigDecimal
)