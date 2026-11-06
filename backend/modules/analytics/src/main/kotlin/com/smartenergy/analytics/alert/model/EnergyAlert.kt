package com.smartenergy.analytics.alert.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.util.UUID

@Document("energy_alerts")
data class EnergyAlert(
    @Id val id: String = UUID.randomUUID().toString(),
    @Indexed(unique = true) val measurementId: UUID,
    @Indexed val sensorId: String,
    @Indexed val buildingId: String,
    val type: String,
    val observedValue: Double,
    val threshold: Double,
    @Indexed val createdAt: Instant,
    val status: String = ACTIVE,
    val acknowledgedAt: Instant? = null,
    val acknowledgedBy: String? = null
) {
    companion object {
        const val ACTIVE = "ACTIVE"
        const val ACKNOWLEDGED = "ACKNOWLEDGED"
        const val POWER_THRESHOLD = "POWER_THRESHOLD"
    }
}