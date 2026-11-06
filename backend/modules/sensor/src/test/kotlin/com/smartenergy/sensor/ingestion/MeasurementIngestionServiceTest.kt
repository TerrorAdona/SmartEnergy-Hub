package com.smartenergy.sensor.ingestion

import com.smartenergy.core.exception.SmartEnergyException
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

class MeasurementIngestionServiceTest {
    private val sensorService = Mockito.mock(SensorService::class.java)
    private val publisher = Mockito.mock(RedisMeasurementPublisher::class.java)
    private val service = MeasurementIngestionService(sensorService, publisher)
    private val request = EnergyMeasurementSubmission(
        measurementId = UUID.fromString("09f3e7d4-c7ac-4cc7-a35c-a0fc681c67b4"),
        sensorId = "sensor-1",
        timestamp = Instant.parse("2026-11-06T10:00:00Z"),
        powerKw = 12.5,
        voltage = 230.0,
        temperature = 22.0
    )

    @Test
    fun `publishes measurements only for active sensors`() {
        Mockito.`when`(sensorService.findById("sensor-1")).thenReturn(sensor("ACTIVE"))
        Mockito.`when`(publisher.publish(request)).thenReturn("1749-0")

        val response: MeasurementEnqueuedResponse = service.enqueue(request)

        assertThat(response.measurementId).isEqualTo(request.measurementId)
        assertThat(response.streamRecordId).isEqualTo("1749-0")
        assertThat(response.status).isEqualTo("QUEUED")
        Mockito.verify(publisher).publish(request)
    }

    @Test
    fun `rejects inactive sensors before publishing`() {
        Mockito.`when`(sensorService.findById("sensor-1")).thenReturn(sensor("INACTIVE"))

        val exception = assertThrows(SmartEnergyException::class.java) { service.enqueue(request) }

        assertThat(exception.httpStatus.value()).isEqualTo(409)
        assertThat(exception.errorCode).isEqualTo("SENSOR_INACTIVE")
        Mockito.verifyNoInteractions(publisher)
    }

    private fun sensor(status: String) = SensorResponse(
        id = "sensor-1",
        name = "Main meter",
        type = "POWER",
        buildingId = "building-1",
        status = status,
        consumptionThreshold = BigDecimal("40"),
        createdAt = Instant.EPOCH
    )
}