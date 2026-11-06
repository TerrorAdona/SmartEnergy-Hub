-- Keyspace and the table used by EnergyMeasurement.
-- The official Cassandra image does not execute this file itself;
-- the cassandra-init service applies it after the node is healthy.

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
) WITH default_time_to_live = 2592000;
