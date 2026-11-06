package com.smartenergy.core.config

import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder

@Configuration
class JacksonConfig {

    @Bean
    fun jacksonObjectMapperBuilder(): Jackson2ObjectMapperBuilder {
        // modulesToInstall keeps Jackson's Kotlin module. modules(...) would replace it
        // and the API could no longer read Kotlin request bodies.
        return Jackson2ObjectMapperBuilder()
            .modulesToInstall(JavaTimeModule())
            .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    }
}