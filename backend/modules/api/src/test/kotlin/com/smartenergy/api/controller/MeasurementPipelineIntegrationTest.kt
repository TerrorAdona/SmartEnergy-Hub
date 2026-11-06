package com.smartenergy.api.controller

import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.model.Sensor
import com.smartenergy.sensor.registry.repository.SensorRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.CassandraContainer
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.MongoDBContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("pipeline-test")
@Testcontainers(disabledWithoutDocker = true)
class MeasurementPipelineIntegrationTest {
    @Autowired
    private lateinit var restTemplate: TestRestTemplate

    @Autowired
    private lateinit var sensorRepository: SensorRepository

    @LocalServerPort
    private var port: Int = 0

    @BeforeEach
    fun registerActiveSensor() {
        sensorRepository.deleteById(SENSOR_ID)
        sensorRepository.save(
            Sensor(
                id = SENSOR_ID,
                name = "Pipeline integration sensor",
                type = "POWER",
                buildingId = "integration-building",
                status = "ACTIVE",
                consumptionThreshold = BigDecimal("40")
            )
        )
    }

    @Test
    fun `submits through API Redis Streams consumer Cassandra and history API`() {
        val timestamp = Instant.now().minusSeconds(2).truncatedTo(ChronoUnit.MILLIS)
        val request = EnergyMeasurementSubmission(
            measurementId = UUID.randomUUID(),
            sensorId = SENSOR_ID,
            timestamp = timestamp,
            powerKw = 17.25,
            voltage = 229.5,
            temperature = 21.75
        )

        val accepted = restTemplate.postForEntity(
            "http://localhost:$port/api/v1/measurements",
            request,
            MeasurementEnqueuedResponse::class.java
        )
        assertThat(accepted.statusCode.value()).isEqualTo(202)
        assertThat(accepted.body?.measurementId).isEqualTo(request.measurementId)

        val from = timestamp.minusSeconds(5)
        val to = timestamp.plusSeconds(5)
        val historyUrl = "http://localhost:$port/api/v1/measurements" +
            "?sensorId=$SENSOR_ID&from=$from&to=$to"
        val deadline = System.nanoTime() + 30_000_000_000L
        var history: Array<EnergyMeasurementResponse> = emptyArray()
        while (System.nanoTime() < deadline && history.none { it.measurementId == request.measurementId }) {
            val response = restTemplate.getForEntity(historyUrl, Array<EnergyMeasurementResponse>::class.java)
            if (response.statusCode.is2xxSuccessful) history = response.body ?: emptyArray()
            if (history.none { it.measurementId == request.measurementId }) Thread.sleep(250)
        }

        val stored = history.firstOrNull { it.measurementId == request.measurementId }
        assertThat(stored).isNotNull
        assertThat(stored!!.sensorId).isEqualTo(SENSOR_ID)
        assertThat(stored.powerKw).isEqualTo(17.25)
        assertThat(stored.voltage).isEqualTo(229.5)
        assertThat(stored.temperature).isEqualTo(21.75)
    }

    companion object {
        private const val SENSOR_ID = "pipeline-integration-sensor"

        @Container
        @JvmField
        val cassandra = CassandraContainer(DockerImageName.parse("cassandra:4.1"))
            .withInitScript("cassandra-keyspace.cql")

        @Container
        @JvmField
        val redis: GenericContainer<*> = GenericContainer<Nothing>(DockerImageName.parse("redis:7.4-alpine"))
            .withExposedPorts(6379)

        @Container
        @JvmField
        val mongo = MongoDBContainer(DockerImageName.parse("mongo:7.0"))

        @JvmStatic
        @DynamicPropertySource
        fun configureServiceConnections(registry: DynamicPropertyRegistry) {
            registry.add("spring.cassandra.contact-points", cassandra::getHost)
            registry.add("spring.cassandra.port") { cassandra.getMappedPort(9042) }
            registry.add("spring.cassandra.local-datacenter", cassandra::getLocalDatacenter)
            registry.add("spring.cassandra.username", cassandra::getUsername)
            registry.add("spring.cassandra.password", cassandra::getPassword)
            registry.add("spring.cassandra.keyspace-name") { "smartenergy" }
            registry.add("spring.cassandra.schema-action") { "CREATE_IF_NOT_EXISTS" }
            registry.add("spring.data.mongodb.uri") { mongo.getReplicaSetUrl("smartenergy") }
            registry.add("spring.data.redis.host", redis::getHost)
            registry.add("spring.data.redis.port") { redis.getMappedPort(6379) }
            registry.add("spring.data.redis.password") { "" }
        }
    }
}