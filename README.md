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
cd backend && ./gradlew :modules:api:bootRun

# Run frontend (in separate terminal)
cd frontend && npm install && npm run dev
```

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