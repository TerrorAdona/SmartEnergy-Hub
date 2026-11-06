package com.smartenergy.measurement.ingestion

import com.smartenergy.measurement.model.EnergyMeasurement
import com.smartenergy.measurement.model.EnergyMeasurementKey
import com.smartenergy.measurement.repository.EnergyMeasurementRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Range
import org.springframework.data.redis.RedisSystemException
import org.springframework.data.redis.connection.stream.Consumer
import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.connection.stream.ReadOffset
import org.springframework.data.redis.connection.stream.StreamOffset
import org.springframework.data.redis.connection.stream.StreamReadOptions
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Component
class RedisMeasurementConsumer(
    private val redisTemplate: StringRedisTemplate,
    private val repository: EnergyMeasurementRepository,
    @Value("\${app.sensor.stream.key:sensor:readings}") private val streamKey: String,
    @Value("\${app.sensor.stream.consumer-group:measurement-ingestion}") private val consumerGroup: String,
    @Value("\${app.sensor.stream.consumer-name:measurement-writer}") private val consumerName: String,
    @Value("\${app.sensor.stream.dead-letter-key:sensor:readings:dead-letter}") private val deadLetterKey: String,
    @Value("\${app.sensor.stream.batch-size:100}") private val batchSize: Long,
    @Value("\${app.sensor.stream.poll-timeout:5000}") private val pollTimeoutMillis: Long,
    @Value("\${app.sensor.stream.pending-idle-time:30s}") private val pendingIdleTime: Duration,
    @Value("\${app.sensor.stream.max-deliveries:5}") private val maxDeliveries: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private var groupReady = false

    @Scheduled(fixedDelayString = "\${app.sensor.stream.poll-interval-ms:1000}")
    fun poll() {
        try {
            if (!groupReady) {
                ensureConsumerGroup()
                groupReady = true
            }
            reclaimPending()
            readNewRecords()
        } catch (exception: Exception) {
            logger.error("Redis measurement poll failed; it will be retried", exception)
        }
    }

    internal fun processRecord(record: MapRecord<String, String, String>) {
        val operations = redisTemplate.opsForStream<String, String>()
        val measurement = try {
            record.value.toMeasurement()
        } catch (exception: IllegalArgumentException) {
            sendToDeadLetter(record, exception)
            operations.acknowledge(streamKey, consumerGroup, record.id)
            return
        } catch (exception: java.time.DateTimeException) {
            sendToDeadLetter(record, exception)
            operations.acknowledge(streamKey, consumerGroup, record.id)
            return
        }

        try {
            repository.save(measurement)
            operations.acknowledge(streamKey, consumerGroup, record.id)
            logger.info(
                "Persisted measurement {} for sensor {}",
                measurement.key.measurementId,
                measurement.key.sensorId
            )
        } catch (exception: Exception) {
            logger.error(
                "Measurement ${measurement.key.measurementId} remains pending after persistence failure",
                exception
            )
        }
    }

    private fun ensureConsumerGroup() {
        val operations = redisTemplate.opsForStream<String, String>()
        val bootstrapId = operations.add(streamKey, mapOf("_bootstrap" to "true"))
        try {
            operations.createGroup(streamKey, ReadOffset.from("0-0"), consumerGroup)
        } catch (exception: RedisSystemException) {
            if (!exception.hasBusyGroup()) throw exception
        } finally {
            bootstrapId?.let { operations.delete(streamKey, it) }
        }
        logger.info("Redis stream group '{}' is ready on '{}'", consumerGroup, streamKey)
    }

    private fun reclaimPending() {
        val operations = redisTemplate.opsForStream<String, String>()
        val pending = operations.pending(streamKey, consumerGroup, Range.unbounded<String>(), batchSize)
        val ids = pending
            .filter { it.elapsedTimeSinceLastDelivery >= pendingIdleTime }
            .take(batchSize.toInt())
            .map { it.id }
        if (ids.isEmpty()) return

        val deliveryCounts = pending.associate { it.id to it.totalDeliveryCount }
        operations.claim(streamKey, consumerGroup, consumerName, pendingIdleTime, *ids.toTypedArray())
            .forEach { record ->
                if ((deliveryCounts[record.id] ?: 0) >= maxDeliveries) {
                    sendToDeadLetter(record, IllegalStateException("Maximum delivery count exceeded"))
                    operations.acknowledge(streamKey, consumerGroup, record.id)
                } else {
                    processRecord(record)
                }
            }
    }

    private fun readNewRecords() {
        val records = redisTemplate.opsForStream<String, String>().read(
            Consumer.from(consumerGroup, consumerName),
            StreamReadOptions.empty()
                .count(batchSize)
                .block(Duration.ofMillis(pollTimeoutMillis)),
            StreamOffset.create(streamKey, ReadOffset.lastConsumed())
        )
        records?.forEach(::processRecord)
    }

    private fun sendToDeadLetter(record: MapRecord<String, String, String>, exception: Exception) {
        redisTemplate.opsForStream<String, String>().add(
            deadLetterKey,
            mapOf(
                "sourceRecordId" to record.id.value,
                "failedAt" to Instant.now().toString(),
                "error" to (exception.message ?: exception.javaClass.simpleName),
                "payload" to record.value.toString()
            )
        )
        logger.warn("Malformed stream record {} moved to {}", record.id, deadLetterKey)
    }

    private fun Map<String, String>.toMeasurement(): EnergyMeasurement {
        val timestamp = Instant.parse(required("timestamp"))
        return EnergyMeasurement(
            key = EnergyMeasurementKey(
                sensorId = required("sensorId"),
                bucketDay = timestamp.truncatedTo(ChronoUnit.DAYS),
                timestamp = timestamp,
                measurementId = UUID.fromString(required("measurementId"))
            ),
            powerKw = required("powerKw").toDouble(),
            voltage = required("voltage").toDouble(),
            temperature = required("temperature").toDouble()
        )
    }

    private fun Map<String, String>.required(field: String): String =
        get(field)?.takeIf(String::isNotBlank)
            ?: throw IllegalArgumentException("Missing stream field '$field'")
}

internal fun Throwable.hasBusyGroup(): Boolean {
    var current: Throwable? = this
    while (current != null) {
        if (current.message.orEmpty().contains("BUSYGROUP", ignoreCase = true)) return true
        current = current.cause
    }
    return false
}