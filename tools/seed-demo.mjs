#!/usr/bin/env node
// Demo buildings, sensors, a week of 5-minute measurements, and a few threshold alerts.
// Usage: node tools/seed-demo.mjs [--base-url http://localhost:8080/api/v1]

const MARKER = "Siège SmartEnergy";
const STEP_MS = 5 * 60 * 1000;
const HISTORY_MS = 7 * 24 * 60 * 60 * 1000;

function parseBaseUrl(args) {
  const index = args.indexOf("--base-url");
  const baseUrl = index >= 0 ? args[index + 1] : "http://localhost:8080/api/v1";
  if (!baseUrl) throw new Error("Missing value for --base-url");
  return baseUrl.replace(/\/$/, "");
}

async function request(baseUrl, path, method, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} returned HTTP ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : undefined;
}

function occupancy(hour) {
  if (hour >= 8 && hour < 18) return 1;
  if (hour >= 7 && hour < 20) return 0.55;
  if (hour >= 6 && hour < 22) return 0.35;
  return 0.18;
}

function samplePower(profile, timeMs) {
  const date = new Date(timeMs);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const wave = 1 + 0.06 * Math.sin(timeMs / 3_600_000 + profile.phase);
  const power =
    profile.base * (0.4 + occupancy(hour)) * wave +
    profile.amplitude * occupancy(hour);
  return Number(power.toFixed(3));
}

function sampleClimate(profile, timeMs, powerKw) {
  const date = new Date(timeMs);
  const hour = date.getUTCHours();
  const voltage = Number((profile.voltage + Math.sin(timeMs / 1_800_000) * 1.4).toFixed(2));
  const temperature = Number(
    (profile.temperature + (hour >= 11 && hour < 17 ? 1.8 : 0) + (powerKw / profile.base) * 0.4).toFixed(2),
  );
  return { voltage, temperature };
}

const catalog = [
  {
    name: "Siège SmartEnergy",
    location: "Lyon Part-Dieu",
    description: "Bureaux administratifs et salle de réunion",
    sensors: [
      {
        name: "Compteur général",
        type: "POWER",
        status: "ACTIVE",
        consumptionThreshold: 55,
        base: 12,
        amplitude: 16,
        phase: 0.2,
        voltage: 230,
        temperature: 21.5,
      },
      {
        name: "Climatisation open space",
        type: "POWER",
        status: "ACTIVE",
        consumptionThreshold: 28,
        base: 6,
        amplitude: 9,
        phase: 1.1,
        voltage: 229,
        temperature: 22.4,
      },
    ],
  },
  {
    name: "Entrepôt logistique",
    location: "Vénissieux",
    description: "Quais de chargement et stockage",
    sensors: [
      {
        name: "Compteur des quais",
        type: "POWER",
        status: "ACTIVE",
        consumptionThreshold: 90,
        base: 24,
        amplitude: 28,
        phase: 0.6,
        voltage: 398,
        temperature: 16.2,
      },
      {
        name: "Chambre froide",
        type: "POWER",
        status: "ACTIVE",
        consumptionThreshold: 34,
        base: 14,
        amplitude: 4,
        phase: 2.4,
        voltage: 231,
        temperature: 4.8,
      },
    ],
  },
  {
    name: "Atelier de production",
    location: "Saint-Étienne",
    description: "Ligne d'assemblage et utilités",
    sensors: [
      {
        name: "Ligne d'assemblage",
        type: "POWER",
        status: "ACTIVE",
        consumptionThreshold: 75,
        base: 20,
        amplitude: 22,
        phase: 0.9,
        voltage: 400,
        temperature: 23.1,
      },
      {
        name: "Compresseur d'air",
        type: "POWER",
        status: "INACTIVE",
        consumptionThreshold: 40,
        base: 8,
        amplitude: 6,
        phase: 1.7,
        voltage: 230,
        temperature: 24,
      },
    ],
  },
];

async function pool(items, limit, worker) {
  let cursor = 0;
  let failures = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        await worker(items[index], index);
      } catch (error) {
        failures += 1;
        if (failures <= 5) console.error(error.message);
        if (failures === 20) throw new Error("Too many measurement submissions failed");
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, () => run()));
  if (failures > 0) throw new Error(`${failures} measurement submissions failed`);
}

async function waitForHistory(baseUrl, sensorId, from, minimum) {
  const deadline = Date.now() + 4 * 60 * 1000;
  let count = 0;
  while (Date.now() < deadline) {
    const rows = await request(
      baseUrl,
      `/measurements?sensorId=${encodeURIComponent(sensorId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(new Date().toISOString())}`,
      "GET",
    );
    count = rows.length;
    if (count >= minimum) return count;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Only ${count} measurements were stored for ${sensorId}; expected at least ${minimum}`);
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));
  const buildings = await request(baseUrl, "/buildings", "GET");
  const activeSensors = [];
  if (!buildings.some((building) => building.name === MARKER)) {
    for (const site of catalog) {
      const building = await request(baseUrl, "/buildings", "POST", {
        name: site.name,
        location: site.location,
        description: site.description,
      });
      console.log(`Building ${building.name} (${building.id})`);
      for (const sensor of site.sensors) {
        const created = await request(baseUrl, "/sensors", "POST", {
          name: sensor.name,
          type: sensor.type,
          buildingId: building.id,
          status: sensor.status,
          consumptionThreshold: sensor.consumptionThreshold,
        });
        console.log(`  Sensor ${created.name} [${created.status}] threshold ${created.consumptionThreshold} kW`);
        if (created.status === "ACTIVE") {
          activeSensors.push({ ...sensor, id: created.id, buildingName: building.name });
        }
      }
    }
  } else {
    const sensors = await request(baseUrl, "/sensors", "GET");
    const profiles = catalog.flatMap((site) => site.sensors);
    for (const sensor of sensors) {
      const profile = profiles.find((item) => item.name === sensor.name && item.status === "ACTIVE");
      if (profile) activeSensors.push({ ...profile, id: sensor.id });
    }
    console.log(`Reusing ${activeSensors.length} demo sensors.`);
  }

  const now = Date.now() - 5_000;
  const start = now - HISTORY_MS;
  const submissions = [];
  for (const sensor of activeSensors) {
    const existing = await request(
      baseUrl,
      `/measurements?sensorId=${encodeURIComponent(sensor.id)}&from=${encodeURIComponent(new Date(start).toISOString())}&to=${encodeURIComponent(new Date().toISOString())}`,
      "GET",
    );
    const storedTimes = existing
      .map((row) => new Date(row.timestamp).getTime())
      .sort((left, right) => left - right);
    const storedSeconds = new Set(storedTimes.map((time) => Math.round(time / 1000)));
    const origin = storedTimes[0] ?? start;
    for (let time = origin; time <= now; time += STEP_MS) {
      if (storedSeconds.has(Math.round(time / 1000))) continue;
      const powerKw = samplePower(sensor, time);
      const climate = sampleClimate(sensor, time, powerKw);
      submissions.push({
        sensorId: sensor.id,
        timestamp: new Date(time).toISOString(),
        powerKw,
        voltage: climate.voltage,
        temperature: climate.temperature,
      });
    }
  }

  const existingAlerts = await request(baseUrl, "/alerts?limit=50", "GET");
  const alertedSensors = new Set(existingAlerts.map((alert) => alert.sensorId));
  const spikes = [
    { sensorName: "Climatisation open space", minutesAgo: 35, powerKw: 36.4 },
    { sensorName: "Compteur des quais", minutesAgo: 22, powerKw: 104.2 },
    { sensorName: "Chambre froide", minutesAgo: 14, powerKw: 41.8 },
    { sensorName: "Ligne d'assemblage", minutesAgo: 8, powerKw: 92.6 },
  ];
  for (const spike of spikes) {
    const sensor = activeSensors.find((item) => item.name === spike.sensorName);
    if (!sensor || alertedSensors.has(sensor.id)) continue;
    const time = now - spike.minutesAgo * 60 * 1000;
    const climate = sampleClimate(sensor, time, spike.powerKw);
    submissions.push({
      sensorId: sensor.id,
      timestamp: new Date(time).toISOString(),
      powerKw: spike.powerKw,
      voltage: climate.voltage,
      temperature: climate.temperature,
    });
  }

  console.log(`Submitting ${submissions.length} measurements...`);
  let sent = 0;
  await pool(submissions, 12, async (measurement) => {
    await request(baseUrl, "/measurements", "POST", measurement);
    sent += 1;
    if (sent % 1000 === 0) console.log(`  queued ${sent}/${submissions.length}`);
  });
  console.log(`Queued ${sent} measurements. Waiting for Cassandra...`);

  const stored = await waitForHistory(
    baseUrl,
    activeSensors[0].id,
    new Date(start).toISOString(),
    Math.floor(HISTORY_MS / STEP_MS),
  );
  console.log(`History check: ${stored} rows for ${activeSensors[0].name}.`);

  const alerts = await request(baseUrl, "/alerts?status=ACTIVE&limit=20", "GET");
  const acknowledged = alerts.find((alert) =>
    activeSensors.find((sensor) => sensor.id === alert.sensorId && sensor.name === "Compteur des quais"),
  );
  if (acknowledged) {
    await request(baseUrl, `/alerts/${acknowledged.id}/acknowledge`, "PATCH", {
      acknowledgedBy: "Camille Martin",
    });
    console.log(`Acknowledged alert ${acknowledged.id}.`);
  }
  console.log(`Active alerts remaining: ${alerts.length - (acknowledged ? 1 : 0)}.`);
  console.log("Demo data is ready.");
}

await main();
