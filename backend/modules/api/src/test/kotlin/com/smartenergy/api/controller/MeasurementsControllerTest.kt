package com.smartenergy.api.controller

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.smartenergy.core.exception.GlobalExceptionHandler
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.measurement.service.MeasurementHistoryService
import com.smartenergy.sensor.ingestion.MeasurementIngestionService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.http.MediaType
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import java.time.Instant
import java.util.UUID

class MeasurementsControllerTest {
    private val ingestionService = Mockito.mock(MeasurementIngestionService::class.java)
    private val historyService = Mockito.mock(MeasurementHistoryService::class.java)
    private val sensorService = Mockito.mock(SensorService::class.java)
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        val validator = LocalValidatorFactoryBean().apply { afterPropertiesSet() }
        mockMvc = MockMvcBuilders.standaloneSetup(
            MeasurementsController(ingestionService, historyService, sensorService)
        )
            .setControllerAdvice(GlobalExceptionHandler())
            .setValidator(validator)
            .setMessageConverters(
                MappingJackson2HttpMessageConverter(jacksonObjectMapper().registerModule(JavaTimeModule()))
            )
            .build()
    }

    @Test
    fun `accepts a valid measurement for asynchronous ingestion`() {
        val measurement = request("2026-11-06T10:00:00Z")
        Mockito.`when`(ingestionService.enqueue(measurement)).thenReturn(
            MeasurementEnqueuedResponse(measurement.measurementId, "1749-0")
        )

        mockMvc.perform(
            post("/api/v1/measurements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{"measurementId":"${measurement.measurementId}","sensorId":"sensor-1","timestamp":"${measurement.timestamp}","powerKw":12.5,"voltage":230.0,"temperature":22.0}"""
                )
        )
            .andExpect(status().isAccepted)
            .andExpect(jsonPath("$.status", equalTo("QUEUED")))
            .andExpect(jsonPath("$.streamRecordId", equalTo("1749-0")))
    }

    @Test
    fun `rejects invalid measurements before enqueueing`() {
        mockMvc.perform(
            post("/api/v1/measurements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{"sensorId":" ","timestamp":"2099-01-01T00:00:00Z","powerKw":12.5,"voltage":-1,"temperature":250}"""
                )
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.errorCode", equalTo("VALIDATION_ERROR")))
        Mockito.verifyNoInteractions(ingestionService)
    }

    @Test
    fun `returns history filtered by sensor and period`() {
        val from = Instant.parse("2026-11-06T09:00:00Z")
        val to = Instant.parse("2026-11-06T11:00:00Z")
        Mockito.`when`(historyService.findHistory("sensor-1", from, to)).thenReturn(
            listOf(
                EnergyMeasurementResponse(
                    UUID.fromString("09f3e7d4-c7ac-4cc7-a35c-a0fc681c67b4"),
                    "sensor-1",
                    Instant.parse("2026-11-06T10:00:00Z"),
                    12.5,
                    230.0,
                    22.0
                )
            )
        )

        mockMvc.perform(
            get("/api/v1/measurements")
                .param("sensorId", "sensor-1")
                .param("from", from.toString())
                .param("to", to.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].sensorId", equalTo("sensor-1")))
            .andExpect(jsonPath("$[0].powerKw", equalTo(12.5)))
            .andExpect(jsonPath("$[0].voltage", equalTo(230.0)))
            .andExpect(jsonPath("$[0].temperature", equalTo(22.0)))
    }

    private fun request(timestamp: String) = EnergyMeasurementSubmission(
        measurementId = UUID.fromString("09f3e7d4-c7ac-4cc7-a35c-a0fc681c67b4"),
        sensorId = "sensor-1",
        timestamp = Instant.parse(timestamp),
        powerKw = 12.5,
        voltage = 230.0,
        temperature = 22.0
    )
}