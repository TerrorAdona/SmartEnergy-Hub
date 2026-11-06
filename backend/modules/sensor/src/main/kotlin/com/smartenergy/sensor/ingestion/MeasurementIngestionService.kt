package com.smartenergy.sensor.ingestion

import com.smartenergy.core.exception.SmartEnergyException
import com.smartenergy.sensor.registry.dto.EnergyMeasurementSubmission
import com.smartenergy.sensor.registry.dto.MeasurementEnqueuedResponse
import com.smartenergy.sensor.registry.service.SensorService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

@Service
class MeasurementIngestionService(
    private val sensorService: SensorService,
    private val publisher: RedisMeasurementPublisher
) {
    fun enqueue(measurement: EnergyMeasurementSubmission): MeasurementEnqueuedResponse {
        val sensor = sensorService.findById(measurement.sensorId)
        if (sensor.status != "ACTIVE") {
            throw SmartEnergyException(
                "Sensor ${sensor.id} is inactive",
                "SENSOR_INACTIVE",
                HttpStatus.CONFLICT
            )
        }

        val streamRecordId = publisher.publish(measurement)
        return MeasurementEnqueuedResponse(measurement.measurementId, streamRecordId)
    }
}