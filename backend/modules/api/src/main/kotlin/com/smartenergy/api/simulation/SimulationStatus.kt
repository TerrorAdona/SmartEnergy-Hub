package com.smartenergy.api.simulation

import java.time.Instant

data class SimulationStatus(
    val running: Boolean,
    val intervalSeconds: Long,
    val activeSensors: Int,
    val lastPublished: Int,
    val lastTickAt: Instant?
)

data class SimulationUpdateRequest(
    val running: Boolean
)
