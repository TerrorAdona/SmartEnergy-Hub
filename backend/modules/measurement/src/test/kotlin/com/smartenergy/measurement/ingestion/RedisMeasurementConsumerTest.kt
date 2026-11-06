package com.smartenergy.measurement.ingestion

import com.smartenergy.measurement.model.EnergyMeasurement
import com.smartenergy.measurement.repository.EnergyMeasurementRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.mockito.Mockito
import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.connection.stream.RecordId
import org.springframework.data.redis.core.StreamOperations
import org.springframework.data.redis.core.StringRedisTemplate
import java.time.Duration
import java.time.Instant
import java.util.UUID

class RedisMeasurementConsumerTest {
    private val redisTemplate = Mockito.mock(StringRedisTemplate::class.java)
    private val streamOperations = Mockito.mock(StreamOperations::class.java) as StreamOperations<String, String, String>
    private val repository = Mockito.mock(EnergyMeasurementRepository::class.java)
    private val consumer = RedisMeasurementConsumer(
        redisTemplate = redisTemplate,
        repository = repository,
        streamKey = "sensor:readings",
        consumerGroup = "measurement-ingestion",
        consumerName = "measurement-writer",
        deadLetterKey = "sensor:readings:dead-letter",
        batchSize = 100,
        pollTimeoutMillis = 100,
        pendingIdleTime = Duration.ofSeconds(30),
        maxDeliveries = 5
    )

    @BeforeEach
    fun setUp() {
        Mockito.`when`(redisTemplate.opsForStream<String, String>()).thenReturn(streamOperations)
    }

    @Test
    fun `acks a record only after Cassandra persistence succeeds`() {
        val record = measurementRecord()

        consumer.processRecord(record)

        val captor = ArgumentCaptor.forClass(EnergyMeasurement::class.java)
        Mockito.verify(repository).save(captor.capture())
        assert(captor.value.key.measurementId == UUID.fromString(record.value["measurementId"]))
        assert(captor.value.key.bucketDay == Instant.parse("2026-11-06T00:00:00Z"))
        Mockito.verify(streamOperations).acknowledge("sensor:readings", "measurement-ingestion", record.id)
    }

    @Test
    fun `leaves records pending when Cassandra persistence fails`() {
        Mockito.`when`(repository.save(Mockito.any(EnergyMeasurement::class.java)))
            .thenThrow(IllegalStateException("Cassandra unavailable"))

        consumer.processRecord(measurementRecord())

        Mockito.verify(streamOperations, Mockito.never())
            .acknowledge(Mockito.anyString(), Mockito.anyString(), Mockito.any(RecordId::class.java))
    }

    @Test
    fun `moves malformed records to dead letter before acknowledging them`() {
        val record = MapRecord.create("sensor:readings", mapOf("sensorId" to "sensor-1"))
            .withId(RecordId.of("1750-0"))

        consumer.processRecord(record)

        val deadLetterCall = Mockito.mockingDetails(streamOperations).invocations
            .first { it.method.name == "add" }
        assert(deadLetterCall.getArgument<String>(0) == "sensor:readings:dead-letter")
        val deadLetterFields = deadLetterCall.getArgument<Map<String, String>>(1)
        assert(deadLetterFields["sourceRecordId"] == record.id.value)
        Mockito.verify(streamOperations)
            .acknowledge("sensor:readings", "measurement-ingestion", record.id)
        Mockito.verifyNoInteractions(repository)
    }

    private fun measurementRecord(): MapRecord<String, String, String> = MapRecord
        .create(
            "sensor:readings",
            mapOf(
                "measurementId" to "09f3e7d4-c7ac-4cc7-a35c-a0fc681c67b4",
                "sensorId" to "sensor-1",
                "timestamp" to "2026-11-06T10:15:00Z",
                "powerKw" to "12.5",
                "voltage" to "230.0",
                "temperature" to "22.0"
            )
        )
        .withId(RecordId.of("1749-0"))
}