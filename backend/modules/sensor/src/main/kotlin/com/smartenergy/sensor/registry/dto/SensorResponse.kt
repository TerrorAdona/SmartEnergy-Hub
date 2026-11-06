package com.smartenergy.sensor.registry.dto

import java.math.BigDecimal
import java.time.Instant

data class SensorResponse(
    val id: String,
    val name: String,
    val type: String,
    val buildingId: String,
    val status: String,
    val consumptionThreshold: BigDecimal,
    val createdAt: Instant
)