package com.smartenergy.core.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.time.Instant
import java.util.UUID

@Schema(description = "Raw sensor reading from stream ingestion")
data class SensorReadingDto(
    @Schema(description = "Unique measurement ID", example = "018f3a5b-7c2d-4e8f-9a1b-2c3d4e5f6a7b")
    @NotNull
    val measurementId: UUID,

    @Schema(description = "Sensor identifier", example = "sensor-001")
    @NotBlank
    val sensorId: String,

    @Schema(description = "Measurement timestamp", example = "2026-11-05T10:30:00Z")
    @NotNull
    val timestamp: Instant,

    @Schema(description = "Measured value", example = "23.5")
    @NotNull
    @Positive
    val value: Double,

    @Schema(description = "Quality indicator", example = "GOOD", allowableValues = ["GOOD", "UNCERTAIN", "BAD"])
    @NotBlank
    val quality: String,

    @Schema(description = "Unit of measurement", example = "CELSIUS")
    @NotBlank
    val unit: String,

    @Schema(description = "Additional metadata")
    val metadata: Map<String, String> = emptyMap()
)