package com.smartenergy.core.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Value("\${springdoc.api-docs.path:/v3/api-docs}")
    private lateinit var apiDocsPath: String

    @Value("\${server.port:8080}")
    private var serverPort: Int = 8080

    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(Info()
                .title("SmartEnergy Hub API")
                .description("Energy monitoring platform API")
                .version("v1")
                .license(License().name("MIT").url("https://opensource.org/licenses/MIT")))
            .servers(listOf(Server().url("http://localhost:\${serverPort}/api/v1").description("Development server")))
            .components(Components()
                .addSecuritySchemes("bearerAuth", SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")))
            .addSecurityItem(SecurityRequirement().addList("bearerAuth"))
    }
}