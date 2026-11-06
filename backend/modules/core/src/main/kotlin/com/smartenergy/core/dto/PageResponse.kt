package com.smartenergy.core.dto

import io.swagger.v3.oas.annotations.media.Schema
import org.springframework.data.domain.Page

@Schema(description = "Paginated response wrapper")
data class PageResponse<T>(
    @Schema(description = "Page content")
    val content: List<T>,

    @Schema(description = "Pagination metadata")
    val page: PageMetadata
) {
    companion object {
        fun <T> of(page: Page<T>): PageResponse<T> {
            return PageResponse(
                content = page.content,
                page = PageMetadata(
                    number = page.number,
                    size = page.size,
                    totalElements = page.totalElements,
                    totalPages = page.totalPages,
                    first = page.isFirst,
                    last = page.isLast,
                    numberOfElements = page.numberOfElements
                )
            )
        }
    }
}

@Schema(description = "Pagination metadata")
data class PageMetadata(
    @Schema(description = "Current page number (0-indexed)", example = "0")
    val number: Int,

    @Schema(description = "Page size", example = "20")
    val size: Int,

    @Schema(description = "Total number of elements", example = "100")
    val totalElements: Long,

    @Schema(description = "Total number of pages", example = "5")
    val totalPages: Int,

    @Schema(description = "Is first page", example = "true")
    val first: Boolean,

    @Schema(description = "Is last page", example = "false")
    val last: Boolean,

    @Schema(description = "Number of elements in current page", example = "20")
    val numberOfElements: Int
)