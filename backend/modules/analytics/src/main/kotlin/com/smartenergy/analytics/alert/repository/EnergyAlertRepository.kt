package com.smartenergy.analytics.alert.repository

import com.smartenergy.analytics.alert.model.EnergyAlert
import org.springframework.data.mongodb.repository.MongoRepository
import java.util.UUID

interface EnergyAlertRepository : MongoRepository<EnergyAlert, String> {
    fun existsByMeasurementId(measurementId: UUID): Boolean
}