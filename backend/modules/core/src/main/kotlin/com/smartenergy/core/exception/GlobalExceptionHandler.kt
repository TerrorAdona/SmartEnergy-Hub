package com.smartenergy.core.exception

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.context.request.WebRequest
import java.time.Instant
import java.util.UUID

@RestControllerAdvice
class GlobalExceptionHandler {
    private val logger = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(SmartEnergyException::class)
    fun handleSmartEnergyException(ex: SmartEnergyException, request: WebRequest): ResponseEntity<ErrorResponse> {
        return buildErrorResponse(ex.httpStatus, ex.message ?: "Unknown error", ex.errorCode, request, ex.errors, ex)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException, request: WebRequest): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.fieldErrors.map { fieldError ->
            ValidationError(fieldError.field, fieldError.defaultMessage ?: "Invalid value", fieldError.rejectedValue)
        }
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_ERROR", request, errors, ex)
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(ex: MethodArgumentTypeMismatchException, request: WebRequest): ResponseEntity<ErrorResponse> {
        val field = ex.name
        return buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Invalid value for '$field'",
            "VALIDATION_ERROR",
            request,
            listOf(ValidationError(field, "Invalid value", ex.value)),
            ex
        )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableMessage(ex: HttpMessageNotReadableException, request: WebRequest): ResponseEntity<ErrorResponse> {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Request body is invalid", "INVALID_REQUEST_BODY", request, emptyList(), ex)
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception, request: WebRequest): ResponseEntity<ErrorResponse> {
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred",
            "INTERNAL_ERROR",
            request,
            emptyList(),
            ex
        )
    }

    private fun buildErrorResponse(
        status: HttpStatus,
        message: String,
        errorCode: String,
        request: WebRequest,
        details: List<ValidationError>,
        cause: Exception
    ): ResponseEntity<ErrorResponse> {
        val traceId = UUID.randomUUID().toString()
        val path = request.getDescription(false).replace("uri=", "")
        if (status.is5xxServerError) {
            logger.error("Request failed status={} code={} path={} traceId={}", status.value(), errorCode, path, traceId, cause)
        } else {
            logger.warn("Request rejected status={} code={} path={} traceId={} message={}", status.value(), errorCode, path, traceId, message)
        }
        val errorResponse = ErrorResponse(
            timestamp = Instant.now(),
            status = status.value(),
            error = status.getReasonPhrase() ?: "Error",
            message = message,
            path = path,
            errorCode = errorCode,
            details = details,
            traceId = traceId
        )
        return ResponseEntity.status(status).body(errorResponse)
    }
}

data class ErrorResponse(
    val timestamp: Instant,
    val status: Int,
    val error: String,
    val message: String,
    val path: String,
    val errorCode: String,
    val details: List<ValidationError> = emptyList(),
    val traceId: String
)