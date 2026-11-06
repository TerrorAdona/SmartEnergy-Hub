package com.smartenergy.api.controller

import com.smartenergy.analytics.dto.AggregationInterval
import com.smartenergy.analytics.dto.AnalyticsSummary
import com.smartenergy.analytics.service.AnalyticsService
import com.smartenergy.core.exception.ValidationException
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.temporal.ChronoUnit

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Energy consumption statistics derived from Cassandra measurements")
class AnalyticsController(private val analyticsService: AnalyticsService) {
    @GetMapping("/summary")
    @Operation(
        summary = "Get energy analytics",
        description = "Returns measured energy, weighted average power, time buckets, per-building and per-sensor statistics, recent readings, and an optional period comparison."
    )
    fun summary(
        @Parameter(description = "Inclusive start timestamp; defaults to 24 hours before to")
        @RequestParam(required = false) from: Instant?,
        @Parameter(description = "Inclusive end timestamp; defaults to now")
        @RequestParam(required = false) to: Instant?,
        @Parameter(description = "Bucket size: HOUR, DAY or MONTH")
        @RequestParam(defaultValue = "HOUR") interval: String,
        @Parameter(description = "Optional comparison period start")
        @RequestParam(required = false) compareFrom: Instant?,
        @Parameter(description = "Optional comparison period end")
        @RequestParam(required = false) compareTo: Instant?
    ): AnalyticsSummary {
        val end = to ?: Instant.now()
        val start = from ?: end.minus(24, ChronoUnit.HOURS)
        val bucket = try {
            AggregationInterval.valueOf(interval.uppercase())
        } catch (_: IllegalArgumentException) {
            throw ValidationException("Interval must be HOUR, DAY or MONTH")
        }
        return analyticsService.summarize(start, end, bucket, compareFrom, compareTo)
    }
}