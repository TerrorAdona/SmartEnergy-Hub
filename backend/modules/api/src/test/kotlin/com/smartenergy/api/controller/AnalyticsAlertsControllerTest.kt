package com.smartenergy.api.controller

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.smartenergy.analytics.alert.dto.EnergyAlertResponse
import com.smartenergy.analytics.alert.model.EnergyAlert
import com.smartenergy.analytics.alert.service.EnergyAlertService
import com.smartenergy.analytics.dto.AggregationInterval
import com.smartenergy.analytics.dto.AnalyticsSummary
import com.smartenergy.analytics.service.AnalyticsService
import com.smartenergy.core.exception.GlobalExceptionHandler
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.http.MediaType
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import java.time.Instant
import java.util.UUID

class AnalyticsAlertsControllerTest {
    private val analyticsService = Mockito.mock(AnalyticsService::class.java)
    private val alertService = Mockito.mock(EnergyAlertService::class.java)
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        val validator = LocalValidatorFactoryBean().apply { afterPropertiesSet() }
        mockMvc = MockMvcBuilders.standaloneSetup(
            AnalyticsController(analyticsService),
            AlertController(alertService)
        )
            .setControllerAdvice(GlobalExceptionHandler())
            .setValidator(validator)
            .setMessageConverters(
                MappingJackson2HttpMessageConverter(jacksonObjectMapper().registerModule(JavaTimeModule()))
            )
            .build()
    }

    @Test
    fun `returns measured analytics for requested interval`() {
        val from = Instant.parse("2026-11-06T00:00:00Z")
        val to = Instant.parse("2026-11-06T12:00:00Z")
        Mockito.`when`(analyticsService.summarize(from, to, AggregationInterval.DAY, null, null))
            .thenReturn(summary(from, to, AggregationInterval.DAY))

        mockMvc.perform(
            get("/api/v1/analytics/summary")
                .param("from", from.toString())
                .param("to", to.toString())
                .param("interval", "DAY")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.buildingCount", equalTo(2)))
            .andExpect(jsonPath("$.totalEnergyKwh", equalTo(4.5)))
    }

    @Test
    fun `passes filters to alert listing and acknowledges an alert`() {
        Mockito.`when`(alertService.findAlerts("ACTIVE", EnergyAlert.POWER_THRESHOLD, "sensor-1", "building-1", null, null, 25))
            .thenReturn(listOf(alert()))
        Mockito.`when`(alertService.acknowledge("alert-1", "operator-1"))
            .thenReturn(alert(status = EnergyAlert.ACKNOWLEDGED, acknowledgedBy = "operator-1"))

        mockMvc.perform(
            get("/api/v1/alerts")
                .param("status", "ACTIVE")
                .param("type", EnergyAlert.POWER_THRESHOLD)
                .param("sensorId", "sensor-1")
                .param("buildingId", "building-1")
                .param("limit", "25")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].sensorName", equalTo("Main power")))

        mockMvc.perform(
            patch("/api/v1/alerts/alert-1/acknowledge")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"acknowledgedBy":"operator-1"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status", equalTo(EnergyAlert.ACKNOWLEDGED)))
            .andExpect(jsonPath("$.acknowledgedBy", equalTo("operator-1")))
    }

    private fun summary(from: Instant, to: Instant, interval: AggregationInterval) = AnalyticsSummary(
        from = from,
        to = to,
        interval = interval,
        buildingCount = 2,
        activeSensorCount = 3,
        totalEnergyKwh = 4.5,
        averagePowerKw = 1.5,
        timeline = emptyList(),
        byBuilding = emptyList(),
        bySensor = emptyList(),
        comparison = null,
        recentMeasurements = emptyList()
    )

    private fun alert(
        status: String = EnergyAlert.ACTIVE,
        acknowledgedBy: String? = null
    ) = EnergyAlertResponse(
        id = "alert-1",
        measurementId = UUID.fromString("09f3e7d4-c7ac-4cc7-a35c-a0fc681c67b4"),
        sensorId = "sensor-1",
        sensorName = "Main power",
        buildingId = "building-1",
        buildingName = "North Wing",
        type = EnergyAlert.POWER_THRESHOLD,
        observedValue = 45.0,
        threshold = 40.0,
        createdAt = Instant.parse("2026-11-06T10:00:00Z"),
        status = status,
        acknowledgedAt = if (acknowledgedBy == null) null else Instant.now(),
        acknowledgedBy = acknowledgedBy
    )
}