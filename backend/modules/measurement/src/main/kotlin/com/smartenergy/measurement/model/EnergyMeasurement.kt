package com.smartenergy.measurement.model

import org.springframework.data.cassandra.core.cql.PrimaryKeyType
import org.springframework.data.cassandra.core.mapping.Column
import org.springframework.data.cassandra.core.mapping.PrimaryKey
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn
import org.springframework.data.cassandra.core.mapping.Table
import java.time.Instant
import java.util.UUID

@PrimaryKeyClass
data class EnergyMeasurementKey(
    @PrimaryKeyColumn(name = "sensor_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    val sensorId: String,
    @PrimaryKeyColumn(name = "bucket_day", ordinal = 1, type = PrimaryKeyType.PARTITIONED)
    val bucketDay: Instant,
    @PrimaryKeyColumn(name = "ts", ordinal = 0, type = PrimaryKeyType.CLUSTERED)
    val timestamp: Instant,
    @PrimaryKeyColumn(name = "measurement_id", ordinal = 1, type = PrimaryKeyType.CLUSTERED)
    val measurementId: UUID
)

@Table("energy_measurements_by_sensor_hour")
data class EnergyMeasurement(
    @PrimaryKey val key: EnergyMeasurementKey,
    @Column("power_kw") val powerKw: Double,
    @Column("voltage") val voltage: Double,
    @Column("temperature") val temperature: Double
)