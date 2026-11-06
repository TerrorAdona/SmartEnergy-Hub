package com.smartenergy.core.util

import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.UUID

object IdUtils {

    private val UUID_V7_EPOCH = Instant.EPOCH.toEpochMilli()

    fun generateMeasurementId(): UUID {
        return UUID.randomUUID() // For now, use random UUID; can upgrade to UUID v7 later
    }

    fun generateCorrelationId(): String {
        return UUID.randomUUID().toString()
    }
}

object TimeUtils {

    private val ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC)

    fun truncateToHour(instant: Instant): Instant {
        return instant.truncatedTo(java.time.temporal.ChronoUnit.HOURS)
    }

    fun truncateToDay(instant: Instant): Instant {
        return instant.atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant()
    }

    fun formatIso(instant: Instant): String {
        return ISO_FORMATTER.format(instant)
    }

    fun parseIso(string: String): Instant {
        return Instant.parse(string)
    }
}

object SensorUtils {

    fun generateSensorId(prefix: String = "sensor"): String {
        return "$prefix-${UUID.randomUUID().toString().substring(0, 8)}"
    }

    fun isValidQuality(quality: String): Boolean {
        return quality.uppercase() in setOf("GOOD", "UNCERTAIN", "BAD")
    }

    fun normalizeQuality(quality: String): String {
        return quality.uppercase().takeIf { isValidQuality(it) } ?: "UNCERTAIN"
    }
}