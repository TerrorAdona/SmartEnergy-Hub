package com.smartenergy.analytics.alert.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class AcknowledgeAlertRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val acknowledgedBy: String = "operator"
)