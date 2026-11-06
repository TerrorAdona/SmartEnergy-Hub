package com.smartenergy.analytics.alert.ingestion

import com.smartenergy.analytics.alert.service.EnergyAlertService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
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
import java.util.UUID

@Component
class RedisAlertConsumer(
    private val redisTemplate: StringRedisTemplate,
    private val alertService: EnergyAlertService,
    @Value("\${app.sensor.stream.key:sensor:readings}") private val streamKey: String,
    @Value("\${app.analytics.alert-consumer-group:alert-detection}") private val consumerGroup: String,
    @Value("\${app.analytics.alert-consumer-name:alert-detector}") private val consumerName: String,
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
            logger.error("Alert stream poll failed; it will be retried", exception)
        }
    }

    internal fun processRecord(record: MapRecord<String, String, String>) {
        val operations = redisTemplate.opsForStream<String, String>()
        val measurement = try {
            record.value.toSubmission()
        } catch (exception: Exception) {
            sendToDeadLetter(record, exception)
            operations.acknowledge(streamKey, consumerGroup, record.id)
            return
        }

        try {
            alertService.createFromStream(measurement)
            operations.acknowledge(streamKey, consumerGroup, record.id)
        } catch (exception: Exception) {
            logger.error("Alert evaluation failed for measurement ${measurement.measurementId}; leaving pending", exception)
        }
    }

    private fun ensureConsumerGroup() {
        val operations = redisTemplate.opsForStream<String, String>()
        val bootstrapId = operations.add(streamKey, mapOf("_bootstrap" to "true"))
        try {
            operations.createGroup(streamKey, ReadOffset.from("0-0"), consumerGroup)
        } catch (exception: RedisSystemException) {
            if (!exception.message.orEmpty().contains("BUSYGROUP", ignoreCase = true)) throw exception
        } finally {
            bootstrapId?.let { operations.delete(streamKey, it) }
        }
        logger.info("Alert consumer group '{}' is ready on '{}'", consumerGroup, streamKey)
    }

    private fun reclaimPending() {
        val operations = redisTemplate.opsForStream<String, String>()
        val pending = operations.pending(streamKey, consumerGroup, org.springframework.data.domain.Range.unbounded<String>(), batchSize)
        val eligible = pending.filter { it.elapsedTimeSinceLastDelivery >= pendingIdleTime }.take(batchSize.toInt())
        if (eligible.isEmpty()) return

        val records = operations.claim(
            streamKey,
            consumerGroup,
            consumerName,
            pendingIdleTime,
            *eligible.map { it.id }.toTypedArray()
        )
        records.forEach { record ->
            val deliveries = eligible.firstOrNull { it.id == record.id }?.totalDeliveryCount ?: 0
            if (deliveries >= maxDeliveries) {
                sendToDeadLetter(record, IllegalStateException("Maximum delivery count exceeded"))
                operations.acknowledge(streamKey, consumerGroup, record.id)
            } else {
                processRecord(record)
            }
        }
    }

    private fun readNewRecords() {
        redisTemplate.opsForStream<String, String>().read(
            Consumer.from(consumerGroup, consumerName),
            StreamReadOptions.empty()
                .count(batchSize)
                .block(Duration.ofMillis(pollTimeoutMillis)),
            StreamOffset.create(streamKey, ReadOffset.lastConsumed())
        )?.forEach(::processRecord)
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
        logger.warn("Malformed alert record {} moved to {}", record.id, deadLetterKey)
    }

    private fun Map<String, String>.toSubmission() = EnergyMeasurementSubmission(
        measurementId = UUID.fromString(required("measurementId")),
        sensorId = required("sensorId"),
        timestamp = Instant.parse(required("timestamp")),
        powerKw = required("powerKw").toDouble(),
        voltage = required("voltage").toDouble(),
        temperature = required("temperature").toDouble()
    )

    private fun Map<String, String>.required(field: String) = get(field)?.takeIf(String::isNotBlank)
        ?: throw IllegalArgumentException("Missing stream field '$field'")
}