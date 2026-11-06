package com.smartenergy.measurement.model

import com.smartenergy.measurement.repository.EnergyMeasurementRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.data.cassandra.core.mapping.Table
import org.springframework.data.cassandra.repository.Query
import java.time.Instant

class EnergyMeasurementSchemaTest {
    @Test
    fun `history query reads the same table that measurements are written to`() {
        val table = EnergyMeasurement::class.java.getAnnotation(Table::class.java).value
        val query = EnergyMeasurementRepository::class.java
            .getMethod(
                "findDayRange",
                String::class.java,
                Instant::class.java,
                Instant::class.java,
                Instant::class.java
            )
            .getAnnotation(Query::class.java)
            .value

        assertThat(table).isEqualTo("energy_measurements_by_sensor_day")
        assertThat(query).contains("FROM $table")
    }
}
