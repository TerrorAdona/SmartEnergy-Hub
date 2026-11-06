package com.smartenergy.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication(scanBasePackages = ["com.smartenergy"])
@EnableScheduling
@EnableAsync
class SmartEnergyApiApplication

fun main(args: Array<String>) {
    runApplication<SmartEnergyApiApplication>(*args)
}