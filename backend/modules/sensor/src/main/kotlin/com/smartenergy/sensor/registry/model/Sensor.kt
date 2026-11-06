package com.smartenergy.sensor.registry.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.math.BigDecimal
import java.time.Instant

@Document(collection = "managed_sensors")
data class Sensor(
    @Id val id: String? = null,
    val name: String,
    val type: String,
    val buildingId: String,
    val status: String = "ACTIVE",
    val consumptionThreshold: BigDecimal,
    val createdAt: Instant = Instant.now()
)