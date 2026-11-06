package com.smartenergy.api.controller

import com.smartenergy.core.exception.ValidationException
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.measurement.service.MeasurementHistoryService
import com.smartenergy.sensor.ingestion.MeasurementIngestionService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.service.SensorService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.temporal.ChronoUnit

@RestController
@RequestMapping("/api/v1/measurements")
class MeasurementsController(
    private val ingestionService: MeasurementIngestionService,
    private val historyService: MeasurementHistoryService,
    private val sensorService: SensorService
) {
    @PostMapping
    fun submit(@Valid @RequestBody request: EnergyMeasurementSubmission): ResponseEntity<MeasurementEnqueuedResponse> =
        ResponseEntity.status(HttpStatus.ACCEPTED).body(ingestionService.enqueue(request))

    @GetMapping
    fun findHistory(
        @RequestParam(required = false) sensorId: String?,
        @RequestParam(required = false) from: Instant?,
        @RequestParam(required = false) to: Instant?
    ): List<EnergyMeasurementResponse> {
        val end = to ?: Instant.now()
        val start = from ?: end.minus(24, ChronoUnit.HOURS)
        if (start.isAfter(end)) throw ValidationException("The start time must be before the end time")

        val sensorIds = sensorId?.let(::listOf) ?: sensorService.findAll().map { it.id }
        return sensorIds
            .flatMap { historyService.findHistory(it, start, end) }
            .sortedByDescending(EnergyMeasurementResponse::timestamp)
    }
}