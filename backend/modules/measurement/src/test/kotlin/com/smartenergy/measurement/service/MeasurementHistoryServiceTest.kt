package com.smartenergy.measurement.service

import com.smartenergy.core.exception.ValidationException
import com.smartenergy.measurement.model.EnergyMeasurement
import com.smartenergy.measurement.model.EnergyMeasurementKey
import com.smartenergy.measurement.repository.EnergyMeasurementRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.invocation.InvocationOnMock
import org.mockito.Mockito
import org.mockito.stubbing.Answer
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class MeasurementHistoryServiceTest {
    private val measurementsByBucket = mutableMapOf<Instant, List<EnergyMeasurement>>()
    private val repository = Mockito.mock(
        EnergyMeasurementRepository::class.java,
        Answer { invocation: InvocationOnMock ->
            if (invocation.method.name == "findDayRange") {
                measurementsByBucket[invocation.getArgument(1)] ?: emptyList<EnergyMeasurement>()
            } else {
                Mockito.RETURNS_DEFAULTS.answer(invocation)
            }
        }
    )
    private val service = MeasurementHistoryService(repository)

    @Test
    fun `reads every daily partition and returns newest measurements first`() {
        val from = Instant.parse("2026-11-06T10:30:00Z")
        val to = Instant.parse("2026-11-06T12:15:00Z")
        val buckets = mapOf(from.truncatedTo(ChronoUnit.DAYS) to listOf(measurement(from, from.plus(10, ChronoUnit.MINUTES))))
        measurementsByBucket.putAll(buckets)

        val result = service.findHistory("sensor-1", from, to)

        assertThat(result).hasSize(1)
        val expectedTimestamps = buckets.values.flatten().map { it.key.timestamp }.sortedDescending()
        assertThat(result.map { it.timestamp }).containsExactlyElementsOf(expectedTimestamps)
        assertThat(Mockito.mockingDetails(repository).invocations.count { it.method.name == "findDayRange" })
            .isEqualTo(1)
    }

    @Test
    fun `rejects invalid and over-retention ranges before querying Cassandra`() {
        val now = Instant.parse("2026-11-06T12:00:00Z")

        assertThrows(ValidationException::class.java) { service.findHistory("sensor-1", now, now.minusSeconds(1)) }
        assertThrows(ValidationException::class.java) { service.findHistory("sensor-1", now.minus(31, ChronoUnit.DAYS), now) }
        Mockito.verifyNoInteractions(repository)
    }

    private fun measurement(bucket: Instant, timestamp: Instant) = EnergyMeasurement(
        key = EnergyMeasurementKey("sensor-1", bucket, timestamp, UUID.randomUUID()),
        powerKw = 12.0,
        voltage = 230.0,
        temperature = 22.0
    )
}