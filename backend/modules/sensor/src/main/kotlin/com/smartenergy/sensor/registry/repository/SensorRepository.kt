package com.smartenergy.sensor.registry.repository

import com.smartenergy.sensor.registry.model.Sensor
import org.springframework.data.mongodb.repository.MongoRepository

interface SensorRepository : MongoRepository<Sensor, String> {
    fun findAllByBuildingId(buildingId: String): List<Sensor>
    fun existsByBuildingId(buildingId: String): Boolean
}