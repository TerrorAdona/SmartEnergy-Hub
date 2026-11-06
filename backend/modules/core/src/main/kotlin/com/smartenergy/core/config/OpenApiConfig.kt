package com.smartenergy.core.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig(
    @Value("\${server.port:8080}") private val serverPort: Int
) {
    @Bean
    fun openAPI(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("SmartEnergy Hub API")
                .description("Energy monitoring platform API. This MVP does not require authentication.")
                .version("v1")
                .license(License().name("MIT").url("https://opensource.org/licenses/MIT"))
        )
        .servers(listOf(Server().url("http://localhost:$serverPort").description("Local server")))
}