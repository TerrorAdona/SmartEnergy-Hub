package com.smartenergy.sensor.registry.dto

import java.util.UUID

data class MeasurementEnqueuedResponse(
    val measurementId: UUID,
    val streamRecordId: String,
    val status: String = "QUEUED"
)