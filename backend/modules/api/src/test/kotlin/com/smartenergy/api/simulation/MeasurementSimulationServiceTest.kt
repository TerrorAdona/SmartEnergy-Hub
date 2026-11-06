package com.smartenergy.api.simulation

import com.smartenergy.sensor.ingestion.MeasurementIngestionService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

class MeasurementSimulationServiceTest {
    private val sensorService = Mockito.mock(SensorService::class.java)
    private val ingestionService = Mockito.mock(MeasurementIngestionService::class.java)
    private val service = MeasurementSimulationService(sensorService, ingestionService, 5_000)

    @Test
    fun `publishes one sample per active sensor and stays under each threshold`() {
        val active = sensor("general", "ACTIVE", "55")
        val inactive = sensor("compressor", "INACTIVE", "40")
        val published = mutableListOf<EnergyMeasurementSubmission>()
        Mockito.`when`(sensorService.findAll(null)).thenReturn(listOf(active, inactive))
        Mockito.doAnswer { invocation ->
            val submission = invocation.getArgument<EnergyMeasurementSubmission>(0)
            published += submission
            MeasurementEnqueuedResponse(submission.measurementId, "1-0")
        }.`when`(ingestionService).enqueue(anySubmission())

        service.setRunning(true)
        service.tick()

        assertThat(published).hasSize(1)
        assertThat(published.single().sensorId).isEqualTo("general")
        assertThat(published.single().powerKw).isGreaterThan(0.0)
        assertThat(published.single().powerKw).isLessThan(55.0)
        assertThat(service.status().running).isTrue()
        assertThat(service.status().lastPublished).isEqualTo(1)
    }

    @Test
    fun `does not publish while the simulation is stopped`() {
        service.tick()

        Mockito.verifyNoInteractions(sensorService, ingestionService)
        assertThat(service.status().running).isFalse()
    }

    @Test
    fun `keeps generated power below the sensor threshold`() {
        val now = Instant.parse("2026-11-06T12:00:00Z")
        repeat(24) { index ->
            val power = MeasurementSimulationService.simulatedPowerKw(
                BigDecimal("28.0"),
                now.epochSecond / 120.0 + index
            )
            assertThat(power).isGreaterThan(0.0)
            assertThat(power).isLessThan(28.0)
        }
        assertThat(MeasurementSimulationService.simulatedPowerKw(BigDecimal.ZERO, 1.0)).isEqualTo(0.0)
    }

    private fun anySubmission(): EnergyMeasurementSubmission {
        Mockito.any(EnergyMeasurementSubmission::class.java)
        return uncheckedNull()
    }

    @Suppress("UNCHECKED_CAST")
    private fun <T> uncheckedNull(): T = null as T

    private fun sensor(id: String, status: String, threshold: String) = SensorResponse(
        id = id,
        name = id,
        type = "POWER",
        buildingId = "building-1",
        status = status,
        consumptionThreshold = BigDecimal(threshold),
        createdAt = Instant.parse("2026-11-06T10:00:00Z")
    )
}
