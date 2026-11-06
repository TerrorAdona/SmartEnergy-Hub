CREATE KEYSPACE IF NOT EXISTS smartenergy
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS smartenergy.energy_measurements_by_sensor_day (
    sensor_id text,
    bucket_day timestamp,
    ts timestamp,
    measurement_id uuid,
    power_kw double,
    voltage double,
    temperature double,
    PRIMARY KEY ((sensor_id, bucket_day), ts, measurement_id)
);