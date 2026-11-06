-- SmartEnergy Hub Cassandra Schema
-- Keyspace and tables for time-series measurements

-- Create keyspace with replication factor 1 for development
CREATE KEYSPACE IF NOT EXISTS smartenergy
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
AND durable_writes = true;

USE smartenergy;

-- Table for raw measurements partitioned by sensor and hour bucket
-- Query pattern: Get measurements for a sensor in a time range
CREATE TABLE IF NOT EXISTS measurements_by_sensor_hour (
    sensor_id uuid,
    bucket_hour timestamp,  -- truncated to hour (e.g., 2026-11-05 10:00:00)
    ts timestamp,         -- actual measurement timestamp
    measurement_id uuid,  -- unique ID for deduplication
    value double,
    quality text,
    unit text,
    metadata map<text, text>,
    PRIMARY KEY ((sensor_id, bucket_hour), ts, measurement_id)
) WITH CLUSTERING ORDER BY (ts DESC, measurement_id ASC)
  AND compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'HOURS',
    'compaction_window_size': '1'
  }
  AND default_time_to_live = 2592000  -- 30 days TTL
  AND gc_grace_seconds = 864000;      -- 10 days

-- Energy telemetry queried by sensor and period; one daily partition bounds history scans.
CREATE TABLE IF NOT EXISTS energy_measurements_by_sensor_day (
    sensor_id text,
  bucket_day timestamp,
    ts timestamp,
    measurement_id uuid,
    power_kw double,
    voltage double,
    temperature double,
    PRIMARY KEY ((sensor_id, bucket_day), ts, measurement_id)
) WITH CLUSTERING ORDER BY (ts DESC, measurement_id ASC)
  AND compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'HOURS',
    'compaction_window_size': '1'
  }
  AND default_time_to_live = 2592000
  AND gc_grace_seconds = 864000;

-- Table for hourly aggregations
-- Query pattern: Get hourly stats for a sensor in a time range
CREATE TABLE IF NOT EXISTS measurements_hourly_agg (
    sensor_id uuid,
    bucket_hour timestamp,
    count bigint,
    min_value double,
    max_value double,
    sum_value double,
    avg_value double,
    first_ts timestamp,
    last_ts timestamp,
    PRIMARY KEY ((sensor_id), bucket_hour)
) WITH CLUSTERING ORDER BY (bucket_hour DESC)
  AND default_time_to_live = 31536000  -- 1 year TTL
  AND gc_grace_seconds = 864000;

-- Table for daily aggregations
-- Query pattern: Get daily stats for a sensor in a time range
CREATE TABLE IF NOT EXISTS measurements_daily_agg (
    sensor_id uuid,
    bucket_day timestamp,
    count bigint,
    min_value double,
    max_value double,
    sum_value double,
    avg_value double,
    first_ts timestamp,
    last_ts timestamp,
    PRIMARY KEY ((sensor_id), bucket_day)
) WITH CLUSTERING ORDER BY (bucket_day DESC)
  AND default_time_to_live = 31536000  -- 1 year TTL
  AND gc_grace_seconds = 864000;

-- Table for alerts
-- Query pattern: Get alerts by sensor, by time range, by severity
CREATE TABLE IF NOT EXISTS alerts (
    alert_id uuid,
    sensor_id uuid,
    equipment_id uuid,
    severity text,        -- CRITICAL, WARNING, INFO
    message text,
    value double,
    threshold double,
    unit text,
    status text,          -- ACTIVE, ACKNOWLEDGED, RESOLVED
    triggered_at timestamp,
    acknowledged_at timestamp,
    resolved_at timestamp,
    acknowledged_by text,
    PRIMARY KEY ((sensor_id), triggered_at, alert_id)
) WITH CLUSTERING ORDER BY (triggered_at DESC, alert_id ASC)
  AND default_time_to_live = 2592000  -- 30 days TTL
  AND gc_grace_seconds = 864000;

-- Table for equipment-sensor mapping
CREATE TABLE IF NOT EXISTS equipment_sensors (
    equipment_id uuid,
    sensor_id uuid,
    sensor_type text,
    location text,
    installed_at timestamp,
    PRIMARY KEY (equipment_id, sensor_id)
) WITH CLUSTERING ORDER BY (sensor_id ASC);

-- Index for querying measurements by quality
CREATE INDEX IF NOT EXISTS ON measurements_by_sensor_hour (quality);