package com.smartenergy.equipment.building.dto

import java.time.Instant

data class BuildingResponse(
    val id: String,
    val name: String,
    val location: String,
    val description: String?,
    val createdAt: Instant
)