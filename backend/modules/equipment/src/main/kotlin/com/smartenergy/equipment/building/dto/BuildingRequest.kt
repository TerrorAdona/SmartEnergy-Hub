package com.smartenergy.equipment.building.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class BuildingRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val name: String,
    @field:NotBlank
    @field:Size(max = 250)
    val location: String,
    @field:Size(max = 1000)
    val description: String? = null
)