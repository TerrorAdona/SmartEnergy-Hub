package com.smartenergy.analytics.alert.dto

import java.time.Instant
import java.util.UUID

data class EnergyAlertResponse(
    val id: String,
    val measurementId: UUID,
    val sensorId: String,
    val sensorName: String,
    val buildingId: String,
    val buildingName: String,
    val type: String,
    val observedValue: Double,
    val threshold: Double,
    val createdAt: Instant,
    val status: String,
    val acknowledgedAt: Instant?,
    val acknowledgedBy: String?
)