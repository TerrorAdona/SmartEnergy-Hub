package com.smartenergy.api.simulation

import com.smartenergy.sensor.ingestion.MeasurementIngestionService
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.SensorResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.sin
import kotlin.random.Random

@Service
class MeasurementSimulationService(
    private val sensorService: SensorService,
    private val ingestionService: MeasurementIngestionService,
    @Value("\${app.simulation.interval-ms:5000}") private val intervalMs: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val running = AtomicBoolean(false)
    private val ticking = AtomicBoolean(false)

    @Volatile private var lastPublished = 0
    @Volatile private var lastTickAt: Instant? = null

    fun status(): SimulationStatus {
        val activeSensors = runCatching { activeSensors().size }.getOrDefault(0)
        return SimulationStatus(
            running = running.get(),
            intervalSeconds = intervalMs / 1000,
            activeSensors = activeSensors,
            lastPublished = lastPublished,
            lastTickAt = lastTickAt
        )
    }

    fun setRunning(enabled: Boolean): SimulationStatus {
        running.set(enabled)
        logger.info("Measurement simulation {}", if (enabled) "started" else "stopped")
        return status()
    }

    @Scheduled(fixedDelayString = "\${app.simulation.interval-ms:5000}")
    fun tick() {
        if (!running.get() || !ticking.compareAndSet(false, true)) return
        try {
            val sensors = activeSensors()
            var published = 0
            val now = Instant.now()
            sensors.forEachIndexed { index, sensor ->
                try {
                    ingestionService.enqueue(sample(sensor, index, now))
                    published += 1
                } catch (exception: Exception) {
                    logger.warn("Simulation skipped sensor {}: {}", sensor.id, exception.message)
                }
            }
            lastPublished = published
            lastTickAt = now
            logger.info("Simulation published {} measurements for {} active sensors", published, sensors.size)
        } finally {
            ticking.set(false)
        }
    }

    private fun activeSensors(): List<SensorResponse> =
        sensorService.findAll(null).filter { it.status == "ACTIVE" }

    private fun sample(sensor: SensorResponse, index: Int, now: Instant): EnergyMeasurementSubmission {
        val phase = now.epochSecond / 120.0 + index
        return EnergyMeasurementSubmission(
            measurementId = UUID.randomUUID(),
            sensorId = sensor.id,
            timestamp = now,
            powerKw = simulatedPowerKw(sensor.consumptionThreshold, phase),
            voltage = (230 + (Random.nextDouble() - 0.5) * 8).coerceIn(0.0, 1000.0),
            temperature = (22 + 4 * sin(phase / 3) + Random.nextDouble()).coerceIn(-80.0, 150.0)
        )
    }

    companion object {
        internal fun simulatedPowerKw(threshold: BigDecimal, phase: Double): Double {
            val limit = threshold.toDouble()
            if (limit <= 0.0) return 0.0
            val fraction = 0.55 + 0.15 * sin(phase)
            return (limit * fraction).coerceIn(0.01, limit * 0.9)
        }
    }
}
