package com.smartenergy.api.controller

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.smartenergy.core.exception.GlobalExceptionHandler
import com.smartenergy.equipment.building.dto.BuildingRequest
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.equipment.building.service.BuildingService
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.http.MediaType
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import java.math.BigDecimal
import java.time.Instant

class EquipmentControllerTest {
    private val buildingService = Mockito.mock(BuildingService::class.java)
    private val sensorService = Mockito.mock(SensorService::class.java)
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        val validator = LocalValidatorFactoryBean().apply { afterPropertiesSet() }
        mockMvc = MockMvcBuilders.standaloneSetup(
            BuildingController(buildingService, sensorService),
            SensorController(sensorService)
        )
            .setControllerAdvice(GlobalExceptionHandler())
            .setValidator(validator)
            .setMessageConverters(
                MappingJackson2HttpMessageConverter(jacksonObjectMapper().registerModule(JavaTimeModule()))
            )
            .build()
    }

    @Test
    fun `creates a building with HTTP 201`() {
        Mockito.`when`(buildingService.create(BuildingRequest("North Wing", "Campus"))).thenReturn(
            BuildingResponse("building-1", "North Wing", "Campus", null, Instant.EPOCH)
        )

        mockMvc.perform(
            post("/api/v1/buildings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"North Wing","location":"Campus"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id", equalTo("building-1")))
    }

    @Test
    fun `rejects invalid building fields with HTTP 400`() {
        mockMvc.perform(
            post("/api/v1/buildings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":" ","location":""}""")
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.errorCode", equalTo("VALIDATION_ERROR")))
    }

    @Test
    fun `updates sensor status through HTTP patch`() {
        Mockito.`when`(sensorService.updateStatus("sensor-1", "INACTIVE")).thenReturn(
            SensorResponse(
                "sensor-1",
                "Main power",
                "POWER",
                "building-1",
                "INACTIVE",
                BigDecimal("12.5"),
                Instant.EPOCH
            )
        )

        mockMvc.perform(
            patch("/api/v1/sensors/sensor-1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"status":"INACTIVE"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status", equalTo("INACTIVE")))
    }

    @Test
    fun `rejects invalid sensor type and negative threshold with HTTP 400`() {
        mockMvc.perform(
            post("/api/v1/sensors")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{"name":"Power","type":"UNKNOWN","buildingId":"building-1","status":"ACTIVE","consumptionThreshold":-1}"""
                )
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.errorCode", equalTo("VALIDATION_ERROR")))
    }

    @Test
    fun `prevents deleting a building that still has sensors`() {
        Mockito.`when`(sensorService.hasSensorsForBuilding("building-1")).thenReturn(true)

        mockMvc.perform(delete("/api/v1/buildings/building-1"))
            .andExpect(status().isConflict)
            .andExpect(jsonPath("$.errorCode", equalTo("RESOURCE_IN_USE")))
    }
}