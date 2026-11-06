package com.smartenergy.core.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class JacksonConfigTest {
    @Test
    fun `reads Kotlin data classes`() {
        val mapper: ObjectMapper = JacksonConfig().jacksonObjectMapperBuilder().build()
        val value = mapper.readValue("""{"name":"North"}""", NamedValue::class.java)
        assertThat(value.name).isEqualTo("North")
    }

    data class NamedValue(val name: String)
}
