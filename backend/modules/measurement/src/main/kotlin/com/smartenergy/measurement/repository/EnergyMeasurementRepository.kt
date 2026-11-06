package com.smartenergy.measurement.repository

import com.smartenergy.measurement.model.EnergyMeasurement
import com.smartenergy.measurement.model.EnergyMeasurementKey
import org.springframework.data.cassandra.repository.CassandraRepository
import org.springframework.data.cassandra.repository.Query
import java.time.Instant

interface EnergyMeasurementRepository : CassandraRepository<EnergyMeasurement, EnergyMeasurementKey> {
    @Query(
        "SELECT * FROM energy_measurements_by_sensor_day " +
            "WHERE sensor_id = ?0 AND bucket_day = ?1 AND ts >= ?2 AND ts <= ?3"
    )
    fun findDayRange(sensorId: String, bucketDay: Instant, from: Instant, to: Instant): List<EnergyMeasurement>
}