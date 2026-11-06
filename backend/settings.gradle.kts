pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.namespace == "org.springframework.boot") {
                useModule("org.springframework.boot:spring-boot-gradle-plugin:3.3.3")
            }
            if (requested.id.namespace == "io.spring.dependency-management") {
                useModule("io.spring.dependency-management:io.spring.dependency-management.gradle.plugin:1.1.6")
            }
        }
    }
}

rootProject.name = "smartenergy-backend"

include(
    "modules:core",
    "modules:sensor",
    "modules:measurement",
    "modules:equipment",
    "modules:analytics",
    "modules:api"
)