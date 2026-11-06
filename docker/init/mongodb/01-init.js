// Creates the database used by the application.
// Buildings, sensors and alerts are written by the API; no sample documents are inserted.
db = db.getSiblingDB("smartenergy");

db.createCollection("buildings");
db.createCollection("managed_sensors");
db.createCollection("energy_alerts");

db.managed_sensors.createIndex({ buildingId: 1 }, { name: "buildingId" });
db.energy_alerts.createIndex({ measurementId: 1 }, { name: "measurementId", unique: true });
db.energy_alerts.createIndex({ sensorId: 1 }, { name: "sensorId" });
db.energy_alerts.createIndex({ buildingId: 1 }, { name: "buildingId" });
db.energy_alerts.createIndex({ status: 1 }, { name: "status" });
db.energy_alerts.createIndex({ createdAt: 1 }, { name: "createdAt" });
