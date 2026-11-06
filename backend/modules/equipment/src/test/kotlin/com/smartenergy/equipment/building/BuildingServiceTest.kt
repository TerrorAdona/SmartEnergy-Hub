package com.smartenergy.equipment.building

import com.smartenergy.core.exception.ResourceNotFoundException
import com.smartenergy.equipment.building.dto.BuildingRequest
import com.smartenergy.equipment.building.model.Building
import com.smartenergy.equipment.building.repository.BuildingRepository
import com.smartenergy.equipment.building.service.BuildingService
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import java.time.Instant
import java.util.Optional

class BuildingServiceTest {
    private val repository = Mockito.mock(BuildingRepository::class.java)
    private val service = BuildingService(repository)

    @Test
    fun `creates and reads a building`() {
        Mockito.`when`(repository.save(any(Building::class.java))).thenAnswer { invocation ->
            invocation.getArgument<Building>(0).copy(id = "building-1")
        }

        val created = service.create(BuildingRequest("  North Wing  ", "  Campus  ", "  Office  "))

        assertThat(created.id).isEqualTo("building-1")
        assertThat(created.name).isEqualTo("North Wing")
        assertThat(created.location).isEqualTo("Campus")
        Mockito.`when`(repository.findById("building-1")).thenReturn(
            Optional.of(Building("building-1", created.name, created.location, created.description, created.createdAt))
        )
        assertThat(service.findById("building-1")).isEqualTo(created)
    }

    @Test
    fun `updates a building without changing its creation time`() {
        val createdAt = Instant.parse("2026-01-01T00:00:00Z")
        val existing = Building("building-1", "Old name", "Old location", null, createdAt)
        Mockito.`when`(repository.findById("building-1")).thenReturn(Optional.of(existing))
        Mockito.`when`(repository.save(any(Building::class.java))).thenAnswer { it.getArgument<Building>(0) }

        val updated = service.update("building-1", BuildingRequest("New name", "New location"))

        assertThat(updated.name).isEqualTo("New name")
        assertThat(updated.location).isEqualTo("New location")
        assertThat(updated.createdAt).isEqualTo(createdAt)
    }

    @Test
    fun `deletes an existing building and rejects an unknown id`() {
        Mockito.`when`(repository.findById("building-1")).thenReturn(
            Optional.of(Building("building-1", "North Wing", "Campus"))
        )
        Mockito.`when`(repository.findById("missing")).thenReturn(Optional.empty())

        service.delete("building-1")

        Mockito.verify(repository).deleteById("building-1")
        assertThrows(ResourceNotFoundException::class.java) { service.findById("missing") }
    }
}