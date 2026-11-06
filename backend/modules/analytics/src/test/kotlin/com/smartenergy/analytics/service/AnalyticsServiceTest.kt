package com.smartenergy.analytics.service

import com.smartenergy.analytics.dto.AggregationInterval
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.measurement.service.MeasurementHistoryService
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.math.BigDecimal
import java.time.Duration
import java.time.Instant
import java.util.UUID

class AnalyticsServiceTest {
    private val measurementHistory = Mockito.mock(MeasurementHistoryService::class.java)
    private val sensorService = Mockito.mock(SensorService::class.java)
    private val buildingService = Mockito.mock(BuildingService::class.java)
    private val service = AnalyticsService(
        measurementHistory,
        sensorService,
        buildingService,
        Duration.ofMinutes(5)
    )

    @Test
    fun `integrates observed power and groups energy by bucket sensor and building`() {
        val from = Instant.parse("2026-11-06T10:00:00Z")
        val to = Instant.parse("2026-11-06T10:05:00Z")
        Mockito.`when`(sensorService.findAll()).thenReturn(listOf(sensor()))
        Mockito.`when`(buildingService.findAll()).thenReturn(listOf(building()))
        Mockito.`when`(measurementHistory.findHistory("sensor-1", from, to)).thenReturn(
            listOf(measurement(from, 10.0), measurement(to, 20.0))
        )

        val result = service.summarize(from, to, AggregationInterval.HOUR)

        assertThat(result.totalEnergyKwh).isEqualTo(1.25)
        assertThat(result.averagePowerKw).isEqualTo(15.0)
        assertThat(result.timeline).hasSize(1)
        assertThat(result.timeline.single().energyKwh).isEqualTo(1.25)
        assertThat(result.bySensor.single().id).isEqualTo("sensor-1")
        assertThat(result.byBuilding.single().name).isEqualTo("North Wing")
        assertThat(result.activeSensorCount).isEqualTo(1)
        assertThat(result.recentMeasurements).hasSize(2)
    }

    @Test
    fun `compares current and previous periods without inventing a percent for zero baseline`() {
        val from = Instant.parse("2026-11-06T10:00:00Z")
        val to = Instant.parse("2026-11-06T10:05:00Z")
        val compareFrom = from.minus(Duration.ofHours(1))
        val compareTo = to.minus(Duration.ofHours(1))
        Mockito.`when`(sensorService.findAll()).thenReturn(listOf(sensor()))
        Mockito.`when`(buildingService.findAll()).thenReturn(listOf(building()))
        Mockito.`when`(measurementHistory.findHistory("sensor-1", from, to)).thenReturn(
            listOf(measurement(from, 10.0), measurement(to, 20.0))
        )
        Mockito.`when`(measurementHistory.findHistory("sensor-1", compareFrom, compareTo)).thenReturn(emptyList())

        val result = service.summarize(
            from,
            to,
            AggregationInterval.HOUR,
            compareFrom,
            compareTo
        )

        assertThat(result.comparison?.currentEnergyKwh).isEqualTo(1.25)
        assertThat(result.comparison?.previousEnergyKwh).isNull()
        assertThat(result.comparison?.changePercent).isNull()
    }

    @Test
    fun `returns unknown energy when only one sample cannot define an interval`() {
        val from = Instant.parse("2026-11-06T10:00:00Z")
        val to = Instant.parse("2026-11-06T10:05:00Z")
        Mockito.`when`(sensorService.findAll()).thenReturn(listOf(sensor()))
        Mockito.`when`(buildingService.findAll()).thenReturn(listOf(building()))
        Mockito.`when`(measurementHistory.findHistory("sensor-1", from, to))
            .thenReturn(listOf(measurement(from, 10.0)))

        val result = service.summarize(from, to, AggregationInterval.HOUR)

        assertThat(result.totalEnergyKwh).isNull()
        assertThat(result.averagePowerKw).isNull()
        assertThat(result.timeline.single().energyKwh).isNull()
    }

    private fun sensor() = SensorResponse(
        "sensor-1", "Main power", "POWER", "building-1", "ACTIVE", BigDecimal("40"), Instant.EPOCH
    )

    private fun building() = BuildingResponse("building-1", "North Wing", "Campus", null, Instant.EPOCH)

    private fun measurement(timestamp: Instant, power: Double) = EnergyMeasurementResponse(
        UUID.randomUUID(), "sensor-1", timestamp, power, 230.0, 22.0
    )
}