package com.smartenergy.core.exception

import org.springframework.http.HttpStatus

open class SmartEnergyException(
    message: String,
    val errorCode: String,
    val httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    cause: Throwable? = null,
    open val errors: List<ValidationError> = emptyList()
) : RuntimeException(message, cause) {

    constructor(message: String, errorCode: String) : this(message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR, null, emptyList())
    constructor(message: String, errorCode: String, httpStatus: HttpStatus) : this(message, errorCode, httpStatus, null, emptyList())
    constructor(message: String, errorCode: String, httpStatus: HttpStatus, cause: Throwable?) : this(message, errorCode, httpStatus, cause, emptyList())
}

class ResourceNotFoundException(resource: String, id: Any) :
    SmartEnergyException("$resource not found with id: $id", "RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND)

class DuplicateResourceException(resource: String, field: String, value: Any) :
    SmartEnergyException("$resource already exists with $field: $value", "DUPLICATE_RESOURCE", HttpStatus.CONFLICT)

class ValidationException(message: String, override val errors: List<ValidationError> = emptyList()) :
    SmartEnergyException(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST, null, errors)

data class ValidationError(
    val field: String,
    val message: String,
    val rejectedValue: Any? = null
)

class SensorNotConnectedException(sensorId: String) :
    SmartEnergyException("Sensor $sensorId is not connected", "SENSOR_NOT_CONNECTED", HttpStatus.SERVICE_UNAVAILABLE)

class MeasurementIngestionException(sensorId: String, cause: Throwable) :
    SmartEnergyException("Failed to ingest measurement from sensor $sensorId", "MEASUREMENT_INGESTION_FAILED", HttpStatus.INTERNAL_SERVER_ERROR, cause)

class AlertProcessingException(alertId: String, cause: Throwable) :
    SmartEnergyException("Failed to process alert $alertId", "ALERT_PROCESSING_FAILED", HttpStatus.INTERNAL_SERVER_ERROR, cause)

class ExternalServiceException(service: String, message: String, cause: Throwable? = null) :
    SmartEnergyException("External service $service error: $message", "EXTERNAL_SERVICE_ERROR", HttpStatus.BAD_GATEWAY, cause)