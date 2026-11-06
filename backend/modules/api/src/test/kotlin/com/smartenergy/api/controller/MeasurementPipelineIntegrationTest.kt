package com.smartenergy.api.controller

import com.smartenergy.analytics.alert.dto.AcknowledgeAlertRequest
import com.smartenergy.analytics.alert.dto.EnergyAlertResponse
import com.smartenergy.analytics.dto.AnalyticsSummary
import com.smartenergy.core.exception.ErrorResponse
import com.smartenergy.equipment.building.dto.BuildingRequest
import com.smartenergy.equipment.building.dto.BuildingResponse
import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.dto.SensorRequest
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.model.Sensor
import com.smartenergy.sensor.registry.repository.SensorRepository
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.web.util.UriComponentsBuilder
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
import java.time.Duration
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

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @LocalServerPort
    private var port: Int = 0

    private val baseUrl: String
        get() = "http://localhost:$port/api/v1"

    @BeforeEach
    fun registerActiveSensor() {
        val jackson = MappingJackson2HttpMessageConverter(objectMapper)
        restTemplate.restTemplate.messageConverters.removeIf { it is MappingJackson2HttpMessageConverter }
        restTemplate.restTemplate.messageConverters.add(0, jackson)
        restTemplate.restTemplate.requestFactory = JdkClientHttpRequestFactory()
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
    fun `manages buildings and associated sensors`() {
        val createdBuilding = restTemplate.postForEntity(
            "$baseUrl/buildings",
            BuildingRequest("Integration hall", "Campus", "validation"),
            BuildingResponse::class.java
        )
        assertThat(createdBuilding.statusCode.value()).isEqualTo(201)
        val building = requireNotNull(createdBuilding.body)
        assertThat(building.name).isEqualTo("Integration hall")

        val updated = restTemplate.exchange(
            "$baseUrl/buildings/${building.id}",
            HttpMethod.PUT,
            HttpEntity(BuildingRequest("Integration hall renamed", "Campus north", "validation")),
            BuildingResponse::class.java
        )
        assertThat(updated.statusCode.value()).isEqualTo(200)
        assertThat(updated.body?.location).isEqualTo("Campus north")

        val missingSensor = restTemplate.postForEntity(
            "$baseUrl/sensors",
            SensorRequest("Orphan", "POWER", "missing-building", "ACTIVE", BigDecimal("10")),
            ErrorResponse::class.java
        )
        assertThat(missingSensor.statusCode.value()).isEqualTo(404)

        val createdSensor = restTemplate.postForEntity(
            "$baseUrl/sensors",
            SensorRequest("Hall power", "POWER", building.id, "ACTIVE", BigDecimal("25")),
            SensorResponse::class.java
        )
        assertThat(createdSensor.statusCode.value()).isEqualTo(201)
        val sensor = requireNotNull(createdSensor.body)
        assertThat(sensor.buildingId).isEqualTo(building.id)

        val listed = restTemplate.getForEntity(
            "$baseUrl/sensors?buildingId=${building.id}",
            Array<SensorResponse>::class.java
        )
        assertThat(listed.body?.map { it.id }).contains(sensor.id)

        val blockedDelete = restTemplate.exchange(
            "$baseUrl/buildings/${building.id}",
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            ErrorResponse::class.java
        )
        assertThat(blockedDelete.statusCode.value()).isEqualTo(409)
        assertThat(blockedDelete.body?.errorCode).isEqualTo("RESOURCE_IN_USE")

        val deletedSensor = restTemplate.exchange(
            "$baseUrl/sensors/${sensor.id}",
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            Void::class.java
        )
        assertThat(deletedSensor.statusCode.value()).isEqualTo(204)

        val deletedBuilding = restTemplate.exchange(
            "$baseUrl/buildings/${building.id}",
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            Void::class.java
        )
        assertThat(deletedBuilding.statusCode.value()).isEqualTo(204)

        val missingBuilding = restTemplate.getForEntity("$baseUrl/buildings/${building.id}", ErrorResponse::class.java)
        assertThat(missingBuilding.statusCode.value()).isEqualTo(404)
    }

    @Test
    fun `rejects an invalid measurement and an inactive sensor`() {
        val invalid = restTemplate.postForEntity(
            "$baseUrl/measurements",
            objectMapper.readTree(
                """{"sensorId":" ","timestamp":"2099-01-01T00:00:00Z","powerKw":12.5,"voltage":-1,"temperature":250}"""
            ),
            ErrorResponse::class.java
        )
        assertThat(invalid.statusCode.value()).isEqualTo(400)
        assertThat(invalid.body?.errorCode)
            .describedAs("message=%s details=%s", invalid.body?.message, invalid.body?.details)
            .isEqualTo("VALIDATION_ERROR")

        val building = requireNotNull(
            restTemplate.postForEntity(
                "$baseUrl/buildings",
                BuildingRequest("Inactive hall", "Campus", null),
                BuildingResponse::class.java
            ).body
        )
        val sensor = requireNotNull(
            restTemplate.postForEntity(
                "$baseUrl/sensors",
                SensorRequest("Paused meter", "POWER", building.id, "INACTIVE", BigDecimal("10")),
                SensorResponse::class.java
            ).body
        )
        val rejected = restTemplate.postForEntity(
            "$baseUrl/measurements",
            measurement(sensor.id, Instant.now().minusSeconds(2), 12.0),
            ErrorResponse::class.java
        )
        assertThat(rejected.statusCode.value()).isEqualTo(409)
        assertThat(rejected.body?.errorCode).isEqualTo("SENSOR_INACTIVE")
    }

    @Test
    fun `submits through API Redis Streams consumer Cassandra and history API`() {
        val timestamp = Instant.now().minusSeconds(2).truncatedTo(ChronoUnit.MILLIS)
        val request = measurement(SENSOR_ID, timestamp, 17.25)

        val accepted = restTemplate.postForEntity(
            "$baseUrl/measurements",
            request,
            MeasurementEnqueuedResponse::class.java
        )
        assertThat(accepted.statusCode.value()).isEqualTo(202)
        assertThat(accepted.body?.measurementId).isEqualTo(request.measurementId)
        assertThat(accepted.body?.status).isEqualTo("QUEUED")

        val stored = await("persisted measurement ${request.measurementId}") {
            readHistory(SENSOR_ID, timestamp.minusSeconds(5), timestamp.plusSeconds(5))
                .firstOrNull { it.measurementId == request.measurementId }
        }
        assertThat(stored.sensorId).isEqualTo(SENSOR_ID)
        assertThat(stored.powerKw).isEqualTo(17.25)
        assertThat(stored.voltage).isEqualTo(229.5)
        assertThat(stored.temperature).isEqualTo(21.75)
    }

    @Test
    fun `detects a threshold alert, acknowledges it, and summarizes measured energy`() {
        val building = requireNotNull(
            restTemplate.postForEntity(
                "$baseUrl/buildings",
                BuildingRequest("Alert hall", "Campus", null),
                BuildingResponse::class.java
            ).body
        )
        val sensor = requireNotNull(
            restTemplate.postForEntity(
                "$baseUrl/sensors",
                SensorRequest("Threshold meter", "POWER", building.id, "ACTIVE", BigDecimal("10")),
                SensorResponse::class.java
            ).body
        )
        val firstTimestamp = Instant.now().minusSeconds(4).truncatedTo(ChronoUnit.MILLIS)
        val secondTimestamp = firstTimestamp.plusSeconds(2)
        val first = measurement(sensor.id, firstTimestamp, 32.5)
        val second = measurement(sensor.id, secondTimestamp, 28.0)
        assertThat(restTemplate.postForEntity("$baseUrl/measurements", first, MeasurementEnqueuedResponse::class.java).statusCode.value())
            .isEqualTo(202)
        assertThat(restTemplate.postForEntity("$baseUrl/measurements", second, MeasurementEnqueuedResponse::class.java).statusCode.value())
            .isEqualTo(202)

        val alert = await("alert for ${first.measurementId}") {
            val response = restTemplate.getForEntity(
                "$baseUrl/alerts?sensorId=${sensor.id}",
                Array<EnergyAlertResponse>::class.java
            )
            response.body?.firstOrNull { it.measurementId == first.measurementId && it.status == "ACTIVE" }
        }
        assertThat(alert.type).isEqualTo("POWER_THRESHOLD")
        assertThat(alert.observedValue).isEqualTo(32.5)
        assertThat(alert.threshold).isEqualTo(10.0)
        assertThat(alert.buildingId).isEqualTo(building.id)

        val acknowledged = restTemplate.exchange(
            "$baseUrl/alerts/${alert.id}/acknowledge",
            HttpMethod.PATCH,
            HttpEntity(AcknowledgeAlertRequest("auditor")),
            EnergyAlertResponse::class.java
        )
        assertThat(acknowledged.statusCode.value()).isEqualTo(200)
        assertThat(acknowledged.body?.status).isEqualTo("ACKNOWLEDGED")
        assertThat(acknowledged.body?.acknowledgedBy).isEqualTo("auditor")

        await("both measurements in Cassandra") {
            val ids = readHistory(sensor.id, firstTimestamp.minusSeconds(5), secondTimestamp.plusSeconds(5))
                .map { it.measurementId }
                .toSet()
            if (ids.containsAll(setOf(first.measurementId, second.measurementId))) ids else null
        }

        val summaryUri = UriComponentsBuilder.fromHttpUrl("$baseUrl/analytics/summary")
            .queryParam("from", firstTimestamp.minusSeconds(30).toString())
            .queryParam("to", secondTimestamp.plusSeconds(30).toString())
            .queryParam("interval", "HOUR")
            .build()
            .encode()
            .toUri()
        val summary = restTemplate.getForEntity(summaryUri, AnalyticsSummary::class.java)
        assertThat(summary.statusCode.value()).isEqualTo(200)
        assertThat(summary.body?.totalEnergyKwh).isNotNull()
        assertThat(summary.body?.byBuilding?.any { it.id == building.id }).isTrue()
        assertThat(summary.body?.bySensor?.any { it.id == sensor.id }).isTrue()
    }

    private fun measurement(sensorId: String, timestamp: Instant, powerKw: Double) = EnergyMeasurementSubmission(
        measurementId = UUID.randomUUID(),
        sensorId = sensorId,
        timestamp = timestamp,
        powerKw = powerKw,
        voltage = 229.5,
        temperature = 21.75
    )

    private var lastProbe = ""

    private fun readHistory(sensorId: String, from: Instant, to: Instant): List<EnergyMeasurementResponse> {
        val uri = UriComponentsBuilder.fromHttpUrl("$baseUrl/measurements")
            .queryParam("sensorId", sensorId)
            .queryParam("from", from.toString())
            .queryParam("to", to.toString())
            .build()
            .encode()
            .toUri()
        val response = restTemplate.getForEntity(uri, JsonNode::class.java)
        val body = response.body
        lastProbe = "${response.statusCode.value()} $body"
        if (!response.statusCode.is2xxSuccessful || body == null || !body.isArray) return emptyList()
        return objectMapper.convertValue(
            body,
            objectMapper.typeFactory.constructCollectionType(List::class.java, EnergyMeasurementResponse::class.java)
        )
    }

    private fun <T> await(description: String, probe: () -> T?): T {
        val deadline = System.nanoTime() + 30_000_000_000L
        while (System.nanoTime() < deadline) {
            val value = probe()
            if (value != null) return value
            Thread.sleep(250)
        }
        throw AssertionError("Timed out waiting for $description. Last response: $lastProbe")
    }

    companion object {
        private const val SENSOR_ID = "pipeline-integration-sensor"

        @Container
        @JvmField
        val cassandra = CassandraContainer(DockerImageName.parse("cassandra:4.1"))
            .withInitScript("cassandra-keyspace.cql")
            .withStartupTimeout(Duration.ofMinutes(5))
            .withEnv("JVM_OPTS", "-Xms256M -Xmx512M -Xmn64M")

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
            registry.add("app.sensor.stream.poll-timeout") { "400" }
            registry.add("app.sensor.stream.poll-interval-ms") { "200" }
            registry.add("spring.task.scheduling.pool.size") { "4" }
        }
    }
}
