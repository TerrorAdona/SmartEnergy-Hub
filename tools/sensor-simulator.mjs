#!/usr/bin/env node
import { randomUUID } from "node:crypto";

function parseArguments(args) {
    const options = {
        baseUrl: "http://localhost:8080/api/v1",
        intervalSeconds: 5,
        sensorIds: [],
    };

    for (let index = 0; index < args.length; index += 1) {
        const option = args[index];
        const value = args[index + 1];
        if (!value || value.startsWith("--"))
            throw new Error(`Missing value for ${option}`);

        switch (option) {
            case "--base-url":
                options.baseUrl = value.replace(/\/$/, "");
                break;
            case "--sensor-ids":
                options.sensorIds = value
                    .split(",")
                    .map((id) => id.trim())
                    .filter(Boolean);
                break;
            case "--building-id":
                options.buildingId = value;
                break;
            case "--sensor-count":
                options.sensorCount = Number.parseInt(value, 10);
                break;
            case "--interval-seconds":
                options.intervalSeconds = Number(value);
                break;
            case "--duration-seconds":
                options.durationSeconds = Number(value);
                break;
            default:
                throw new Error(`Unknown option: ${option}`);
        }
        index += 1;
    }

    if (
        !Number.isFinite(options.intervalSeconds) ||
        options.intervalSeconds <= 0
    ) {
        throw new Error("--interval-seconds must be a positive number");
    }
    if (options.sensorCount !== undefined && options.sensorCount < 1) {
        throw new Error("--sensor-count must be at least 1");
    }
    if (!options.sensorIds.length && !options.buildingId) {
        throw new Error(
            "Provide --sensor-ids or --building-id to create simulated sensors",
        );
    }
    if (options.buildingId && options.sensorIds.length) {
        throw new Error("Use either --sensor-ids or --building-id, not both");
    }
    return options;
}

async function request(baseUrl, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`${path} returned HTTP ${response.status}: ${detail}`);
    }
    return response.status === 204 ? undefined : response.json();
}

async function createSensors(options) {
    const sensorCount = options.sensorCount ?? 3;
    const sensors = [];
    for (let index = 1; index <= sensorCount; index += 1) {
        const sensor = await request(options.baseUrl, "/sensors", {
            name: `Simulated power sensor ${index}`,
            type: "POWER",
            buildingId: options.buildingId,
            status: "ACTIVE",
            consumptionThreshold: 40,
        });
        sensors.push(sensor);
    }
    return sensors;
}

function sample(sensorId, index) {
    const phase = Date.now() / 120_000 + index;
    return {
        measurementId: randomUUID(),
        sensorId,
        timestamp: new Date().toISOString(),
        powerKw: Number(
            (14 + 8 * Math.sin(phase) + Math.random() * 2).toFixed(3),
        ),
        voltage: Number((230 + (Math.random() - 0.5) * 8).toFixed(2)),
        temperature: Number(
            (22 + 4 * Math.sin(phase / 3) + Math.random()).toFixed(2),
        ),
    };
}

async function main() {
    let options;
    try {
        options = parseArguments(process.argv.slice(2));
    } catch (error) {
        console.error(
            `${error.message}\n\nUsage: node tools/sensor-simulator.mjs (--sensor-ids id1,id2 | --building-id id) [--sensor-count 3] [--interval-seconds 5] [--duration-seconds 60] [--base-url http://localhost:8080/api/v1]`,
        );
        process.exitCode = 1;
        return;
    }

    const sensors = options.buildingId
        ? await createSensors(options)
        : options.sensorIds.map((id) => ({ id }));
    console.log(
        `Simulating ${sensors.length} sensors every ${options.intervalSeconds}s. Press Ctrl+C to stop.`,
    );

    let stopping = false;
    let pendingTimer;
    let finishWaiting;
    process.on("SIGINT", () => {
        stopping = true;
        clearTimeout(pendingTimer);
        finishWaiting?.();
        console.log("Stopping after the current batch...");
    });

    const startedAt = Date.now();
    while (!stopping) {
        const cycleStartedAt = Date.now();
        for (const [index, sensor] of sensors.entries()) {
            try {
                const measurement = sample(sensor.id, index);
                await request(options.baseUrl, "/measurements", measurement);
                console.log(
                    `${measurement.timestamp} sensor=${sensor.id} power=${measurement.powerKw}kW voltage=${measurement.voltage}V temperature=${measurement.temperature}C`,
                );
            } catch (error) {
                console.error(`sensor=${sensor.id}: ${error.message}`);
            }
        }

        if (
            options.durationSeconds &&
            Date.now() - startedAt >= options.durationSeconds * 1000
        ) {
            stopping = true;
            break;
        }
        const delay = Math.max(
            0,
            options.intervalSeconds * 1000 - (Date.now() - cycleStartedAt),
        );
        await new Promise((resolve) => {
            finishWaiting = resolve;
            pendingTimer = setTimeout(resolve, delay);
        });
        finishWaiting = undefined;
        pendingTimer = undefined;
    }
    console.log("Simulation stopped.");
}

await main();
