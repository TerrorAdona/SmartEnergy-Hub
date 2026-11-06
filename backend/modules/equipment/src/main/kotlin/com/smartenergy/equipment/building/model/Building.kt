package com.smartenergy.equipment.building.model

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "buildings")
data class Building(
    @Id val id: String? = null,
    val name: String,
    val location: String,
    val description: String? = null,
    val createdAt: Instant = Instant.now()
)