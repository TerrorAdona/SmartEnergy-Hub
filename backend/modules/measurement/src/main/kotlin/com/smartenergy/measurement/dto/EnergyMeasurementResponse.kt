package com.smartenergy.measurement.dto

import java.time.Instant
import java.util.UUID

data class EnergyMeasurementResponse(
    val measurementId: UUID,
    val sensorId: String,
    val timestamp: Instant,
    val powerKw: Double,
    val voltage: Double,
    val temperature: Double
)