package com.smartenergy.api.controller

import com.smartenergy.analytics.alert.dto.AcknowledgeAlertRequest
import com.smartenergy.analytics.alert.dto.EnergyAlertResponse
import com.smartenergy.analytics.alert.service.EnergyAlertService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/v1/alerts")
@Tag(name = "Alerts", description = "Threshold alerts generated from sensor measurements and stored in MongoDB")
class AlertController(private val alertService: EnergyAlertService) {
    @GetMapping
    @Operation(summary = "List and filter energy alerts")
    fun findAlerts(
        @Parameter(description = "ACTIVE or ACKNOWLEDGED")
        @RequestParam(required = false) status: String?,
        @Parameter(description = "Alert type, for example POWER_THRESHOLD")
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) sensorId: String?,
        @RequestParam(required = false) buildingId: String?,
        @RequestParam(required = false) from: Instant?,
        @RequestParam(required = false) to: Instant?,
        @RequestParam(defaultValue = "100") limit: Int
    ): List<EnergyAlertResponse> = alertService.findAlerts(status, type, sensorId, buildingId, from, to, limit)

    @PatchMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge an active alert")
    fun acknowledge(
        @PathVariable id: String,
        @Valid @RequestBody request: AcknowledgeAlertRequest
    ): EnergyAlertResponse = alertService.acknowledge(id, request.acknowledgedBy)
}