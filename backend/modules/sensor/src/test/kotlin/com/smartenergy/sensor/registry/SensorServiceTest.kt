package com.smartenergy.sensor.registry

import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.dto.SensorRequest
import com.smartenergy.sensor.registry.model.Sensor
import com.smartenergy.sensor.registry.repository.SensorRepository
import com.smartenergy.sensor.registry.service.SensorService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import java.math.BigDecimal
import java.time.Instant
import java.util.Optional

class SensorServiceTest {
    private val repository = Mockito.mock(SensorRepository::class.java)
    private val buildingService = Mockito.mock(BuildingService::class.java)
    private val service = SensorService(repository, buildingService)

    @Test
    fun `creates a sensor associated with an existing building`() {
        Mockito.`when`(buildingService.findById("building-1")).thenReturn(
            BuildingResponse("building-1", "North Wing", "Campus", null, Instant.EPOCH)
        )
        Mockito.`when`(repository.save(any(Sensor::class.java))).thenAnswer { invocation ->
            invocation.getArgument<Sensor>(0).copy(id = "sensor-1")
        }

        val created = service.create(sensorRequest())

        assertThat(created.id).isEqualTo("sensor-1")
        assertThat(created.buildingId).isEqualTo("building-1")
        assertThat(created.consumptionThreshold).isEqualByComparingTo("12.5")
        Mockito.verify(buildingService).findById("building-1")
    }

    @Test
    fun `updates status and deletes the sensor`() {
        val existing = Sensor("sensor-1", "Main power", "POWER", "building-1", "ACTIVE", BigDecimal.TEN)
        Mockito.`when`(repository.findById("sensor-1")).thenReturn(Optional.of(existing))
        Mockito.`when`(repository.save(any(Sensor::class.java))).thenAnswer { it.getArgument<Sensor>(0) }

        assertThat(service.updateStatus("sensor-1", "INACTIVE").status).isEqualTo("INACTIVE")
        service.delete("sensor-1")

        Mockito.verify(repository).deleteById("sensor-1")
    }

    @Test
    fun `updates sensor details and filters sensors by building`() {
        val createdAt = Instant.parse("2026-01-01T00:00:00Z")
        val existing = Sensor("sensor-1", "Main power", "POWER", "building-1", "ACTIVE", BigDecimal.TEN, createdAt)
        Mockito.`when`(repository.findById("sensor-1")).thenReturn(Optional.of(existing))
        Mockito.`when`(buildingService.findById("building-2")).thenReturn(
            BuildingResponse("building-2", "South Wing", "Campus", null, Instant.EPOCH)
        )
        Mockito.`when`(repository.save(any(Sensor::class.java))).thenAnswer { it.getArgument<Sensor>(0) }
        Mockito.`when`(repository.findAllByBuildingId("building-2")).thenReturn(listOf(existing.copy(buildingId = "building-2")))

        val updated = service.update(
            "sensor-1",
            sensorRequest().copy(name = "South power", buildingId = "building-2", consumptionThreshold = BigDecimal("20"))
        )

        assertThat(updated.name).isEqualTo("South power")
        assertThat(updated.buildingId).isEqualTo("building-2")
        assertThat(updated.consumptionThreshold).isEqualByComparingTo("20")
        assertThat(updated.createdAt).isEqualTo(createdAt)
        assertThat(service.findAll("building-2")).hasSize(1)
    }

    @Test
    fun `rejects association with an unknown building`() {
        Mockito.`when`(buildingService.findById("building-1"))
            .thenThrow(ResourceNotFoundException("Building", "building-1"))

        assertThrows(ResourceNotFoundException::class.java) { service.create(sensorRequest()) }
        Mockito.verify(repository, Mockito.never()).save(any(Sensor::class.java))
    }

    private fun sensorRequest() = SensorRequest(
        name = " Main power ",
        type = "POWER",
        buildingId = "building-1",
        consumptionThreshold = BigDecimal("12.5")
    )
}