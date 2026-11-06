// SmartEnergy Hub MongoDB Initialization
// Equipment registry and configuration

db = db.getSiblingDB('smartenergy');

// Create collections with validation
db.createCollection('equipments', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['equipmentId', 'name', 'type', 'location', 'status'],
            properties: {
                equipmentId: {
                    bsonType: 'string',
                    description: 'Unique equipment identifier'
                },
                name: {
                    bsonType: 'string',
                    description: 'Human-readable equipment name'
                },
                type: {
                    bsonType: 'string',
                    enum: ['METER', 'INVERTER', 'BATTERY', 'PV_PANEL', 'WIND_TURBINE', 'GRID_CONNECTION', 'LOAD', 'SENSOR_GATEWAY'],
                    description: 'Equipment type'
                },
                location: {
                    bsonType: 'object',
                    required: ['site', 'building', 'floor'],
                    properties: {
                        site: { bsonType: 'string' },
                        building: { bsonType: 'string' },
                        floor: { bsonType: 'string' },
                        room: { bsonType: 'string' },
                        coordinates: {
                            bsonType: 'object',
                            properties: {
                                lat: { bsonType: 'double' },
                                lon: { bsonType: 'double' }
                            }
                        }
                    }
                },
                status: {
                    bsonType: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'],
                    description: 'Current operational status'
                },
                metadata: {
                    bsonType: 'object',
                    description: 'Flexible metadata for equipment-specific attributes'
                },
                tags: {
                    bsonType: 'array',
                    items: { bsonType: 'string' },
                    description: 'Searchable tags'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'Creation timestamp'
                },
                updatedAt: {
                    bsonType: 'date',
                    description: 'Last update timestamp'
                }
            }
        }
    }
});

db.createCollection('sensors', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['sensorId', 'equipmentId', 'type', 'unit', 'status'],
            properties: {
                sensorId: {
                    bsonType: 'string',
                    description: 'Unique sensor identifier'
                },
                equipmentId: {
                    bsonType: 'string',
                    description: 'Parent equipment ID'
                },
                type: {
                    bsonType: 'string',
                    enum: ['TEMPERATURE', 'HUMIDITY', 'POWER', 'VOLTAGE', 'CURRENT', 'ENERGY', 'FREQUENCY', 'POWER_FACTOR', 'IRRADIANCE', 'WIND_SPEED', 'PRESSURE', 'FLOW', 'LEVEL', 'GENERIC'],
                    description: 'Sensor measurement type'
                },
                unit: {
                    bsonType: 'string',
                    description: 'Unit of measurement (CELSIUS, PERCENT, WATT, VOLT, AMPERE, KWH, HZ, W_M2, M_S, BAR, L_S, M)'
                },
                status: {
                    bsonType: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'FAULT', 'CALIBRATING'],
                    description: 'Sensor status'
                },
                thresholds: {
                    bsonType: 'object',
                    properties: {
                        warningMin: { bsonType: 'double' },
                        warningMax: { bsonType: 'double' },
                        criticalMin: { bsonType: 'double' },
                        criticalMax: { bsonType: 'double' }
                    }
                },
                metadata: {
                    bsonType: 'object'
                },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('alert_configs', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['configId', 'name', 'sensorType', 'condition', 'severity'],
            properties: {
                configId: { bsonType: 'string' },
                name: { bsonType: 'string' },
                sensorType: { bsonType: 'string' },
                condition: {
                    bsonType: 'object',
                    required: ['operator', 'threshold'],
                    properties: {
                        operator: {
                            bsonType: 'string',
                            enum: ['GT', 'GTE', 'LT', 'LTE', 'EQ', 'NE']
                        },
                        threshold: { bsonType: 'double' },
                        durationSeconds: { bsonType: 'int', minimum: 0 }
                    }
                },
                severity: {
                    bsonType: 'string',
                    enum: ['CRITICAL', 'WARNING', 'INFO']
                },
                enabled: { bsonType: 'bool', default: true },
                notificationChannels: {
                    bsonType: 'array',
                    items: { bsonType: 'string', enum: ['EMAIL', 'WEBHOOK', 'SMS', 'SLACK'] }
                },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('sites', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['siteId', 'name', 'timezone'],
            properties: {
                siteId: { bsonType: 'string' },
                name: { bsonType: 'string' },
                timezone: { bsonType: 'string' },
                address: { bsonType: 'object' },
                metadata: { bsonType: 'object' },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
            }
        }
    }
});

// Create indexes
db.equipments.createIndex({ equipmentId: 1 }, { unique: true });
db.equipments.createIndex({ 'location.site': 1, 'location.building': 1 });
db.equipments.createIndex({ status: 1 });
db.equipments.createIndex({ type: 1 });
db.equipments.createIndex({ tags: 1 });

db.sensors.createIndex({ sensorId: 1 }, { unique: true });
db.sensors.createIndex({ equipmentId: 1 });
db.sensors.createIndex({ type: 1 });
db.sensors.createIndex({ status: 1 });

db.alert_configs.createIndex({ configId: 1 }, { unique: true });
db.alert_configs.createIndex({ sensorType: 1, enabled: 1 });

db.sites.createIndex({ siteId: 1 }, { unique: true });

// Insert sample data for development
const now = new Date();

db.equipments.insertMany([
    {
        equipmentId: 'EQ-001',
        name: 'Main Building Meter',
        type: 'METER',
        location: {
            site: 'SITE-001',
            building: 'MAIN',
            floor: 'GROUND',
            room: 'ELECTRICAL_ROOM',
            coordinates: { lat: 48.8566, lon: 2.3522 }
        },
        status: 'ACTIVE',
        metadata: { manufacturer: 'Schneider Electric', model: 'PM5560', firmware: '2.1.0' },
        tags: ['main', 'billing', 'critical'],
        createdAt: now,
        updatedAt: now
    },
    {
        equipmentId: 'EQ-002',
        name: 'Solar Inverter 1',
        type: 'INVERTER',
        location: {
            site: 'SITE-001',
            building: 'ROOFTOP',
            floor: 'ROOF',
            coordinates: { lat: 48.8566, lon: 2.3522 }
        },
        status: 'ACTIVE',
        metadata: { manufacturer: 'Fronius', model: 'Symo 10.0-3-M', capacity_kW: 10 },
        tags: ['solar', 'generation'],
        createdAt: now,
        updatedAt: now
    },
    {
        equipmentId: 'EQ-003',
        name: 'Battery Storage',
        type: 'BATTERY',
        location: {
            site: 'SITE-001',
            building: 'MAIN',
            floor: 'BASEMENT',
            room: 'BATTERY_ROOM',
            coordinates: { lat: 48.8566, lon: 2.3522 }
        },
        status: 'ACTIVE',
        metadata: { manufacturer: 'Tesla', model: 'Powerwall 2', capacity_kWh: 13.5 },
        tags: ['storage', 'backup'],
        createdAt: now,
        updatedAt: now
    }
]);

db.sensors.insertMany([
    {
        sensorId: 'SENSOR-001',
        equipmentId: 'EQ-001',
        type: 'POWER',
        unit: 'WATT',
        status: 'ACTIVE',
        thresholds: { warningMin: 0, warningMax: 80000, criticalMin: 0, criticalMax: 100000 },
        metadata: { phase: 'TOTAL', accuracy_class: '0.5S' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-002',
        equipmentId: 'EQ-001',
        type: 'VOLTAGE',
        unit: 'VOLT',
        status: 'ACTIVE',
        thresholds: { warningMin: 210, warningMax: 250, criticalMin: 190, criticalMax: 260 },
        metadata: { phase: 'L1-N' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-003',
        equipmentId: 'EQ-001',
        type: 'CURRENT',
        unit: 'AMPERE',
        status: 'ACTIVE',
        thresholds: { warningMin: 0, warningMax: 120, criticalMin: 0, criticalMax: 150 },
        metadata: { phase: 'L1' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-004',
        equipmentId: 'EQ-002',
        type: 'POWER',
        unit: 'WATT',
        status: 'ACTIVE',
        thresholds: { warningMin: 0, warningMax: 9000, criticalMin: 0, criticalMax: 10000 },
        metadata: { string: 'MPPT1' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-005',
        equipmentId: 'EQ-002',
        type: 'ENERGY',
        unit: 'KWH',
        status: 'ACTIVE',
        thresholds: {},
        metadata: { counter_type: 'TOTAL_YIELD' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-006',
        equipmentId: 'EQ-003',
        type: 'POWER',
        unit: 'WATT',
        status: 'ACTIVE',
        thresholds: { warningMin: -5000, warningMax: 5000, criticalMin: -6000, criticalMax: 6000 },
        metadata: { direction: 'BIDIRECTIONAL' },
        createdAt: now,
        updatedAt: now
    },
    {
        sensorId: 'SENSOR-007',
        equipmentId: 'EQ-003',
        type: 'ENERGY',
        unit: 'KWH',
        status: 'ACTIVE',
        thresholds: {},
        metadata: { counter_type: 'STATE_OF_CHARGE' },
        createdAt: now,
        updatedAt: now
    }
]);

db.alert_configs.insertMany([
    {
        configId: 'ALERT-001',
        name: 'High Power Consumption',
        sensorType: 'POWER',
        condition: { operator: 'GT', threshold: 80000, durationSeconds: 300 },
        severity: 'WARNING',
        enabled: true,
        notificationChannels: ['EMAIL', 'WEBHOOK'],
        createdAt: now,
        updatedAt: now
    },
    {
        configId: 'ALERT-002',
        name: 'Critical Power Consumption',
        sensorType: 'POWER',
        condition: { operator: 'GT', threshold: 100000, durationSeconds: 60 },
        severity: 'CRITICAL',
        enabled: true,
        notificationChannels: ['EMAIL', 'WEBHOOK', 'SMS'],
        createdAt: now,
        updatedAt: now
    },
    {
        configId: 'ALERT-003',
        name: 'Voltage Out of Range',
        sensorType: 'VOLTAGE',
        condition: { operator: 'LT', threshold: 210, durationSeconds: 60 },
        severity: 'WARNING',
        enabled: true,
        notificationChannels: ['EMAIL'],
        createdAt: now,
        updatedAt: now
    },
    {
        configId: 'ALERT-004',
        name: 'Battery Low',
        sensorType: 'ENERGY',
        condition: { operator: 'LT', threshold: 20, durationSeconds: 300 },
        severity: 'WARNING',
        enabled: true,
        notificationChannels: ['EMAIL', 'WEBHOOK'],
        createdAt: now,
        updatedAt: now
    }
]);

db.sites.insertMany([
    {
        siteId: 'SITE-001',
        name: 'Main Campus',
        timezone: 'Europe/Paris',
        address: {
            street: '123 Energy Street',
            city: 'Paris',
            country: 'France',
            postalCode: '75001'
        },
        metadata: { capacity_kW: 500 },
        createdAt: now,
        updatedAt: now
    }
]);

print('SmartEnergy Hub MongoDB initialization completed successfully.');