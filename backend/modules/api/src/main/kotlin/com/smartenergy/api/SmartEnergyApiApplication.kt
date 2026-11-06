package com.smartenergy.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
import org.springframework.boot.runApplication
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(
    scanBasePackages = ["com.smartenergy"],
    exclude = [
        BatchAutoConfiguration::class,
        DataSourceAutoConfiguration::class
    ]
)
@EnableMongoRepositories(basePackages = ["com.smartenergy"])
@EntityScan(basePackages = ["com.smartenergy"])
@EnableScheduling
@EnableAsync
class SmartEnergyApiApplication

fun main(args: Array<String>) {
    runApplication<SmartEnergyApiApplication>(*args)
}