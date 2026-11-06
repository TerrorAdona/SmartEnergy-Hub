package com.smartenergy.core.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "Standard API response wrapper")
data class ApiResponse<T>(
    @Schema(description = "Response data")
    val data: T?,

    @Schema(description = "Success flag")
    val success: Boolean = true,

    @Schema(description = "Optional message")
    val message: String? = null,

    @Schema(description = "Response timestamp")
    val timestamp: java.time.Instant = java.time.Instant.now()
) {
    companion object {
        fun <T> ok(data: T, message: String? = null): ApiResponse<T> {
            return ApiResponse(data = data, success = true, message = message)
        }

        fun <T> error(message: String): ApiResponse<T> {
            return ApiResponse(data = null, success = false, message = message)
        }
    }
}