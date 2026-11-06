package com.smartenergy.sensor.ingestion

import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.connection.stream.MapRecord
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component

@Component
class RedisMeasurementPublisher(
    private val redisTemplate: StringRedisTemplate,
    @Value("\${app.sensor.stream.key:sensor:readings}") private val streamKey: String
) {
    fun publish(measurement: EnergyMeasurementSubmission): String {
        val fields = mapOf(
            "measurementId" to measurement.measurementId.toString(),
            "sensorId" to measurement.sensorId,
            "timestamp" to measurement.timestamp.toString(),
            "powerKw" to measurement.powerKw.toString(),
            "voltage" to measurement.voltage.toString(),
            "temperature" to measurement.temperature.toString()
        )
        val recordId = redisTemplate.opsForStream<String, String>()
            .add(MapRecord.create(streamKey, fields))
        return requireNotNull(recordId) { "Redis did not return a stream record id" }.value
    }
}