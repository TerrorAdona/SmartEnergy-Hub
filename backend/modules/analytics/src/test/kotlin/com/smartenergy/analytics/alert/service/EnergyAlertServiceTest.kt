package com.smartenergy.analytics.alert.service

import com.smartenergy.analytics.alert.model.EnergyAlert
import com.smartenergy.analytics.alert.repository.EnergyAlertRepository
import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.springframework.data.mongodb.core.query.Query
import org.springframework.data.mongodb.core.MongoTemplate
import java.math.BigDecimal
import java.time.Instant
import java.util.Optional
import java.util.UUID

class EnergyAlertServiceTest {
    private val repository = Mockito.mock(EnergyAlertRepository::class.java)
    private val mongoTemplate = Mockito.mock(MongoTemplate::class.java)
    private val sensorService = Mockito.mock(SensorService::class.java)
    private val buildingService = Mockito.mock(BuildingService::class.java)
    private val service = EnergyAlertService(repository, mongoTemplate, sensorService, buildingService)

    @Test
    fun `creates one alert when power exceeds the configured threshold`() {
        val measurement = measurement(45.0)
        Mockito.`when`(repository.existsByMeasurementId(measurement.measurementId)).thenReturn(false)
        Mockito.`when`(repository.save(any(EnergyAlert::class.java))).thenAnswer { invocation ->
            invocation.getArgument<EnergyAlert>(0)
        }

        val created = service.detectPowerThreshold(measurement, sensor())

        assertThat(created).isTrue()
        val saved = Mockito.mockingDetails(repository).invocations
            .first { it.method.name == "save" }
            .getArgument<EnergyAlert>(0)
        assertThat(saved.type).isEqualTo(EnergyAlert.POWER_THRESHOLD)
        assertThat(saved.observedValue).isEqualTo(45.0)
        assertThat(saved.threshold).isEqualTo(40.0)
        assertThat(saved.buildingId).isEqualTo("building-1")
    }

    @Test
    fun `does not create alert for values below threshold or replayed measurements`() {
        val belowThreshold = measurement(39.0)
        assertThat(service.detectPowerThreshold(belowThreshold, sensor())).isFalse()
        Mockito.verify(repository, Mockito.never()).save(any(EnergyAlert::class.java))

        val replay = measurement(45.0)
        Mockito.`when`(repository.existsByMeasurementId(replay.measurementId)).thenReturn(true)
        assertThat(service.detectPowerThreshold(replay, sensor())).isFalse()
    }

    @Test
    fun `acknowledges an active alert once and leaves acknowledged alerts unchanged`() {
        val alert = alert()
        Mockito.`when`(repository.findById(alert.id)).thenReturn(Optional.of(alert))
        Mockito.`when`(repository.save(any(EnergyAlert::class.java))).thenAnswer { it.getArgument<EnergyAlert>(0) }
        Mockito.`when`(sensorService.findAll()).thenReturn(listOf(sensor()))
        Mockito.`when`(buildingService.findAll()).thenReturn(listOf(building()))

        val acknowledged = service.acknowledge(alert.id, "operator-1")
        assertThat(acknowledged.status).isEqualTo(EnergyAlert.ACKNOWLEDGED)
        assertThat(acknowledged.acknowledgedBy).isEqualTo("operator-1")
        assertThat(acknowledged.acknowledgedAt).isNotNull()

        Mockito.`when`(repository.findById(alert.id)).thenReturn(
            Optional.of(
                alert.copy(
                    status = acknowledged.status,
                    acknowledgedAt = acknowledged.acknowledgedAt,
                    acknowledgedBy = acknowledged.acknowledgedBy
                )
            )
        )
        service.acknowledge(alert.id, "operator-2")
        Mockito.verify(repository, Mockito.times(1)).save(any(EnergyAlert::class.java))
    }

    @Test
    fun `rejects acknowledgement of a missing alert`() {
        Mockito.`when`(repository.findById("missing")).thenReturn(Optional.empty())
        assertThrows(ResourceNotFoundException::class.java) { service.acknowledge("missing", "operator") }
    }

    @Test
    fun `builds Mongo filters for alert type and time period`() {
        val queries = mutableListOf<Query>()
        val template = Mockito.mock(
            MongoTemplate::class.java,
            Answer { invocation: InvocationOnMock ->
                if (invocation.method.name == "find" && invocation.arguments[0] is Query) {
                    queries += invocation.getArgument<Query>(0)
                    emptyList<EnergyAlert>()
                } else {
                    Mockito.RETURNS_DEFAULTS.answer(invocation)
                }
            }
        )
        val filteredService = EnergyAlertService(repository, template, sensorService, buildingService)
        val from = Instant.parse("2026-11-06T00:00:00Z")
        val to = Instant.parse("2026-11-06T12:00:00Z")

        filteredService.findAlerts(
            status = EnergyAlert.ACTIVE,
            type = EnergyAlert.POWER_THRESHOLD,
            sensorId = "sensor-1",
            buildingId = "building-1",
            from = from,
            to = to
        )

        val query = queries.single().queryObject.toString()
        assertThat(query).contains(EnergyAlert.ACTIVE, EnergyAlert.POWER_THRESHOLD, "sensor-1", "building-1")
        assertThat(query).contains("createdAt", "\$gte", "\$lte")
    }

    private fun measurement(powerKw: Double) = EnergyMeasurementSubmission(
        measurementId = UUID.randomUUID(),
        sensorId = "sensor-1",
        timestamp = Instant.parse("2026-11-06T10:00:00Z"),
        powerKw = powerKw,
        voltage = 230.0,
        temperature = 22.0
    )

    private fun sensor() = SensorResponse(
        "sensor-1", "Main power", "POWER", "building-1", "ACTIVE", BigDecimal("40"), Instant.EPOCH
    )

    private fun building() = BuildingResponse("building-1", "North Wing", "Campus", null, Instant.EPOCH)

    private fun alert() = EnergyAlert(
        id = "alert-1",
        measurementId = UUID.randomUUID(),
        sensorId = "sensor-1",
        buildingId = "building-1",
        type = EnergyAlert.POWER_THRESHOLD,
        observedValue = 45.0,
        threshold = 40.0,
        createdAt = Instant.parse("2026-11-06T10:00:00Z")
    )

}