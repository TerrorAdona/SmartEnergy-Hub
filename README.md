# SmartEnergy Hub

Energy monitoring platform — Master 1 university project.

## Stack

- **Backend**: Java 21, Spring Boot 3.3, Gradle 9.8 (multi-module)
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS
- **Data**: Cassandra (time-series), MongoDB (documents), Redis Streams (ingestion)
- **Infra**: Docker Compose, Testcontainers for integration tests
- **API**: OpenAPI 3.1 + auto-generated TypeScript client

## Quick Start

```bash
# Start infrastructure (Cassandra, MongoDB, Redis)
make up

# Run backend (in separate terminal)
cd backend && ./gradlew :modules:api:bootRun --args='--spring.profiles.active=dev'

# Run frontend (in separate terminal)
cd frontend && npm install && npm run dev
```

### Sensor Simulator

Run the standalone simulator against existing active sensors:

```bash
node tools/sensor-simulator.mjs --sensor-ids sensor-id-1,sensor-id-2 --interval-seconds 5
```

Or create simulated sensors in an existing building and stop after one minute:

```bash
node tools/sensor-simulator.mjs --building-id <building-id> --sensor-count 3 --interval-seconds 2 --duration-seconds 60
```

Measurements are submitted to `POST /api/v1/measurements`, queued in Redis Streams, and persisted in Cassandra. Query history with `GET /api/v1/measurements?sensorId=<id>&from=<ISO-8601>&to=<ISO-8601>`.

## Project Structure

```
smartenergy-hub/
├── backend/           # Spring Boot modular monolith
│   └── modules/
│       ├── core/          # Shared kernel
│       ├── sensor/        # Sensor ingestion (Redis Streams)
│       ├── measurement/   # Time-series (Cassandra)
│       ├── equipment/     # Equipment registry (MongoDB)
│       ├── analytics/     # Aggregations & alerts
│       └── api/           # REST controllers + OpenAPI
├── frontend/          # React + TypeScript + Vite
├── docker/            # Docker Compose files
└── docs/              # Architecture decisions, API docs
```

## Commands

See `Makefile` or `justfile` for common tasks:

```bash
make up          # Start infrastructure
make down        # Stop infrastructure
make build       # Build backend
make test        # Run all tests
make frontend    # Build frontend
make generate-api # Generate TS client from OpenAPI
```

## Documentation

- [Architecture Report](ARCHITECTURE_REPORT.md)
- [ADRs](docs/architecture/)
