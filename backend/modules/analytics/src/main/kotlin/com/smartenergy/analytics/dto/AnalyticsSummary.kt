package com.smartenergy.analytics.dto

import com.smartenergy.measurement.dto.EnergyMeasurementResponse
import java.time.Instant

enum class AggregationInterval {
    HOUR,
    DAY,
    MONTH
}

data class EnergyBucket(
    val bucketStart: Instant,
    val energyKwh: Double?,
    val averagePowerKw: Double?,
    val measurementCount: Int
)

data class EntityEnergySummary(
    val id: String,
    val name: String,
    val energyKwh: Double?,
    val averagePowerKw: Double?,
    val measurementCount: Int
)

data class PeriodComparison(
    val currentEnergyKwh: Double?,
    val previousEnergyKwh: Double?,
    val changePercent: Double?
)

data class AnalyticsSummary(
    val from: Instant,
    val to: Instant,
    val interval: AggregationInterval,
    val buildingCount: Int,
    val activeSensorCount: Int,
    val totalEnergyKwh: Double?,
    val averagePowerKw: Double?,
    val timeline: List<EnergyBucket>,
    val byBuilding: List<EntityEnergySummary>,
    val bySensor: List<EntityEnergySummary>,
    val comparison: PeriodComparison?,
    val recentMeasurements: List<EnergyMeasurementResponse>
)