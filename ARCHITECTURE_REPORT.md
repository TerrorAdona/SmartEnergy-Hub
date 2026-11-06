# SmartEnergy Hub — Architecture Report

**Project**: SmartEnergy Hub (Master 1 University Project)  
**Date**: 2026-11-05  
**Author**: Architect Assistant  
**Status**: Draft — awaiting validation before implementation

---

## 1. Environment Analysis

| Component | Version | Status | Notes |
|-----------|---------|--------|-------|
| **Java** | 21.0.13 LTS (Temurin) | ✅ Compatible | LTS, perfect for Spring Boot 3.x |
| **Gradle** | 9.8.2 | ✅ Available | Modern, supports Kotlin DSL |
| **Maven** | ❌ Not installed | — | Use Gradle exclusively |
| **Node.js** | 26.13.0 | ⚠️ Odd version | Latest but odd-numbered = non-LTS; consider 22 LTS |
| **npm** | 11.20.0 | ✅ Compatible | Works with Node 26 |
| **Docker** | 29.8.2 | ✅ Compatible | Modern, Compose v2 included |
| **Docker Compose** | v5.6.0 (v2) | ✅ Compatible | Use `docker compose` (plugin) |
| **Git** | 2.54.0 | ✅ Compatible | Standard |

### Compatibility Notes

- **Java 21 LTS** ✅ Fully supported by Spring Boot 3.3.x / 3.4.x
- **Gradle 9.8** ✅ Compatible with Spring Boot Gradle Plugin 3.x
- **Node 26** ⚠️ **Risk**: Odd versions are not LTS. Recommend Node 22 LTS (or 20 LTS) for stability. If keeping 26, pin exact version in `.nvmrc` / `.tool-versions` and CI.
- **Docker Compose v2** ✅ Use `docker compose` (not `docker-compose`)

---

## 2. Recommended Technical Versions

| Technology | Version | Rationale |
|------------|---------|-----------|
| **Spring Boot** | 3.3.x (or 3.4.x when GA) | Java 21 baseline, Actuator, OpenAPI, WebFlux |
| **Spring Data Cassandra** | 3.3.x | Aligned with Spring Boot |
| **Spring Data MongoDB** | 3.3.x | Aligned with Spring Boot |
| **Spring Data Redis** | 3.3.x | Redis Streams support |
| **Cassandra** | 4.1.x or 5.0.x | 4.1 LTS recommended for stability |
| **MongoDB** | 7.0 or 8.0 | Current stable |
| **Redis** | 7.2 or 7.4 | Streams stable since 5.0 |
| **React** | 18.3.x | Stable, concurrent features |
| **TypeScript** | 5.5.x | Modern, strict mode |
| **Vite** | 5.x | Fast dev server, optimized build |
| **OpenAPI Generator** | 7.x | Generate TS types from SpringDoc |
| **Testcontainers** | 1.20.x | Integration tests with real containers |
| **JUnit** | 5.11.x | Jupiter + Parameters |

---

## 3. General Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SMARTENERGY HUB                                  │
│                         (Modular Monolith)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │   FRONTEND   │     │   BACKEND    │     │  INFRASTRUCTURE│              │
│  │  (React+TS)  │◄───►│  (Spring     │◄───►│  (Docker     │               │
│  │  Port: 5173  │     │   Boot)      │     │   Compose)   │               │
│  └──────────────┘     │  Port: 8080  │     └──────────────┘               │
│                       └──────┬───────┘                                    │
│                              │                                            │
│         ┌────────────────────┼────────────────────┐                      │
│         ▼                    ▼                    ▼                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │  Cassandra  │     │   MongoDB   │     │    Redis    │               │
│  │  (Time-series)│    │ (Documents) │     │  (Streams)  │               │
│  │  Port: 9042 │     │  Port: 27017│     │  Port: 6379 │               │
│  └─────────────┘     └─────────────┘     └─────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles

1. **Modular Monolith**: Single deployable unit, clear module boundaries
2. **Domain-Driven Design**: Modules = bounded contexts
3. **Event-Driven Internally**: Redis Streams for async sensor ingestion
4. **API-First**: OpenAPI contract drives frontend/backend sync
5. **Observability Built-In**: Actuator + Micrometer from day one

---

## 4. Project Structure (Repository Layout)

```
smartenergy-hub/
├── .github/
│   └── workflows/              # CI/CD pipelines
├── docker/
│   ├── docker-compose.yml      # Main stack
│   ├── docker-compose.dev.yml  # Dev overrides (hot reload, ports)
│   └── docker-compose.test.yml # Testcontainers config
├── backend/
│   ├── build.gradle.kts        # Root Gradle config
│   ├── settings.gradle.kts     # Module inclusion
│   ├── gradle.properties       # Version catalog
│   ├── modules/
│   │   ├── core/               # Shared kernel (DTOs, exceptions, config)
│   │   ├── sensor/             # Sensor ingestion & streaming
│   │   ├── measurement/        # Time-series storage (Cassandra)
│   │   ├── equipment/          # Equipment registry (MongoDB)
│   │   ├── analytics/          # Aggregations, alerts, computations
│   │   └── api/                # REST controllers, OpenAPI config
│   └── build/                  # Generated (excluded from git)
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   ├── public/
│   ├── src/
│   │   ├── api/                # Generated TS client + custom hooks
│   │   ├── components/         # Reusable UI components
│   │   ├── features/           # Feature-based modules
│   │   │   ├── dashboard/
│   │   │   ├── equipment/
│   │   │   ├── measurements/
│   │   │   └── alerts/
│   │   ├── pages/              # Route-level components
│   │   ├── layouts/
│   │   ├── hooks/              # Shared React hooks
│   │   ├── stores/             # State (Zustand/Redux Toolkit)
│   │   ├── styles/             # Global CSS / Tailwind config
│   │   ├── types/              # Shared TS types (mirrors API)
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── tests/
├── docs/
│   ├── architecture/           # ADRs, diagrams
│   └── api/                    # OpenAPI spec (generated)
├── .gitignore
├── .editorconfig
├── README.md
└── Makefile / justfile         # Common commands
```

---

## 5. Backend Modules & Responsibilities

| Module | Responsibility | Key Dependencies | Data Store |
|--------|----------------|------------------|------------|
| **core** | Shared kernel: DTOs, exceptions, mappers, config props, security utils | spring-boot-starter, validation, jackson | — |
| **sensor** | Sensor registration, stream ingestion (Redis Streams consumer), protocol adapters (MQTT/HTTP/CoAP simulation) | spring-data-redis, spring-webflux | Redis Streams |
| **measurement** | Time-series persistence, retention policies, downsampling, query API | spring-data-cassandra, spring-boot-starter-cache | Cassandra |
| **equipment** | Equipment CRUD, metadata, location, relationships, firmware | spring-data-mongodb | MongoDB |
| **analytics** | Aggregations (hourly/daily), threshold alerts, statistical computations, scheduled jobs | measurement, equipment, spring-boot-starter-batch | Cassandra (read), MongoDB (config) |
| **api** | REST endpoints, OpenAPI/Swagger UI, DTO→Entity mapping, validation, global exception handling | all modules, springdoc-openapi | — |

### Module Dependency Graph

```
api
  ├─→ sensor
  ├─→ measurement
  ├─→ equipment
  └─→ analytics
        ├─→ measurement
        └─→ equipment
core ← (used by all)
```

**Rule**: No cycles. `core` has zero deps on other modules. `api` depends on all but nothing depends on `api`.

---

## 6. Frontend Organization

### Folder Structure Philosophy: **Feature-First + Colocation**

```
src/
├── api/                    # Generated + manual API layer
│   ├── client.ts           # Axios/Fetch wrapper with interceptors
│   ├── generated/          # openapi-typescript-codegen output
│   └── hooks/              # React Query / SWR hooks per resource
├── components/             # Truly reusable, generic UI
│   ├── ui/                 # Button, Input, Card, Table, Chart wrapper
│   └── layout/             # Header, Sidebar, Footer
├── features/               # Business features (domain-aligned)
│   ├── dashboard/          #   └─ components, hooks, types, api.ts
│   ├── equipment/
│   ├── measurements/
│   └── alerts/
├── pages/                  # Route components (thin, compose features)
├── layouts/                # Page shells (auth, main, empty)
├── hooks/                  # Cross-cutting hooks (useAuth, useWebSocket)
├── stores/                 # Global state (Zustand preferred over Redux)
├── styles/                 # Tailwind + CSS variables
├── types/                  # Shared TS types (can mirror api/generated)
└── utils/                  # Pure helpers (date, format, validation)
```

### Key Technical Choices

| Aspect | Choice | Why |
|--------|--------|-----|
| **Build** | Vite 5 | Fast HMR, optimized prod build |
| **Routing** | React Router v7 | Standard, loader/actions pattern |
| **Data Fetching** | TanStack Query (React Query) v5 | Caching, deduping, mutations, SSR-ready |
| **State** | Zustand | Minimal, no provider boilerplate |
| **Forms** | React Hook Form + Zod | Performance, schema validation |
| **UI Kit** | Headless UI + Tailwind | Accessible, customizable, no heavy dep |
| **Charts** | Recharts or Chart.js | React-native, responsive |
| **Type Sync** | openapi-typescript-codegen | Generate TS from SpringDoc at build |

---

## 7. Frontend ↔ Backend Communication Strategy

### 7.1 REST API (Primary)

- **Protocol**: HTTP/1.1 → HTTP/2 (via Spring Boot Tomcat/Undertow config)
- **Format**: JSON (application/json)
- **Contract**: OpenAPI 3.1 spec served at `/v3/api-docs`
- **Generation**: Frontend builds TS client via `openapi-typescript-codegen` in CI/dev

### 7.2 Real-time Updates (Secondary)

- **Technology**: Server-Sent Events (SSE) via Spring WebFlux
- **Endpoints**: `/api/v1/stream/measurements`, `/api/v1/stream/alerts`
- **Frontend**: `EventSource` API or `@microsoft/fetch-event-source`
- **Fallback**: Polling (React Query refetchInterval) if SSE fails

### 7.3 Authentication & Authorization

| Phase | Approach |
|-------|----------|
| **MVP** | None (internal network) or Basic Auth via Spring Security |
| **Post-MVP** | JWT (Access + Refresh), roles: `ADMIN`, `OPERATOR`, `VIEWER` |
| **Spring Config** | Stateless, CSRF disabled for API, CORS configured for frontend origin |

### 7.4 API Versioning

- **Strategy**: URL versioning `/api/v1/...`
- **Deprecation**: Header `Sunset` + OpenAPI `deprecated: true`

### 7.5 Error Handling Contract

```json
{
  "timestamp": "2026-11-05T10:30:00Z",
  "status": 400,
  "error": "Validation Failed",
  "path": "/api/v1/measurements",
  "details": [
    { "field": "sensorId", "message": "must not be blank" }
  ],
  "traceId": "abc-123"  // for correlating logs
}
```

---

## 8. Technical Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Cassandra on Windows/Docker** | High | High | Use official `cassandra:4.1` image; avoid Windows host paths for data; pre-create keyspace/schema via init container |
| **Cassandra Data Modeling** | High | High | Design queries FIRST; model tables per query pattern; avoid `ALLOW FILTERING`; use compound partition keys wisely |
| **Redis Streams Consumer Groups** | Medium | Medium | Implement idempotent processing; handle rebalancing; configure `MIN-IDLE-TIME` for claiming |
| **MongoDB Schema Evolution** | Medium | Low | Use Spring Data MongoDB `@Version` for optimistic locking; validation at app level |
| **Docker Compose Resource Limits** | Medium | High | Set `mem_limit` and `cpus` for each service; reserve 2GB+ for Cassandra |
| **Gradle Multi-Module Build Speed** | Low | Medium | Enable configuration cache, build cache, parallel execution; use `gradle.properties` |
| **Frontend Type Drift** | Medium | Medium | Generate TS types in CI; fail build if `git diff` shows uncommitted generated files |
| **Node 26 Non-LTS** | Low | Medium | Pin Node 22 LTS in `.nvmrc`, `.tool-versions`, CI; use `volta` or `fnm` |
| **Testcontainers on Windows** | Medium | Medium | Use Docker Desktop WSL2 backend; enable `reuseContainers` for faster dev cycles |
| **Single Developer Bottleneck** | High | High | Prioritize vertical slices; automate repeatable tasks (Makefile/just); document decisions in ADRs |

### Cassandra-Specific Guidance

1. **Keyspace**: `CREATE KEYSPACE smartenergy WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};` (dev) / 3 (prod)
2. **Time-Series Table Pattern**:
   ```sql
   CREATE TABLE measurements_by_sensor_hour (
     sensor_id uuid,
     bucket_hour timestamp,  -- truncated to hour
     ts timestamp,
     value double,
     quality text,
     PRIMARY KEY ((sensor_id, bucket_hour), ts)
   ) WITH CLUSTERING ORDER BY (ts DESC)
     AND compaction = {'class': 'TimeWindowCompactionStrategy'}
     AND default_time_to_live = 2592000;  -- 30 days TTL
   ```
3. **Downsampling**: Separate tables for hourly/daily aggregates written by analytics batch jobs

---

## 9. Development Order (Realistic Solo Roadmap)

### Phase 0: Foundation (Week 1)
- [ ] Initialize Git repo with `.gitignore`, `.editorconfig`, `README.md`
- [ ] Create Gradle multi-module project structure (`backend/`)
- [ ] Create Vite + React + TS + Tailwind project (`frontend/`)
- [ ] Write `docker-compose.yml` with: Cassandra, MongoDB, Redis, (backend), (frontend)
- [ ] Add `Makefile` / `justfile` for common commands (`up`, `down`, `logs`, `test`, `build`)
- [ ] Verify all containers start: `docker compose up -d`

### Phase 1: Core Backend + Infra (Week 2)
- [ ] `core` module: DTOs, exception hierarchy, global handler, OpenAPI config
- [ ] `equipment` module: MongoDB entity, repository, service, REST CRUD
- [ ] `measurement` module: Cassandra entity, repository, write path
- [ ] Integration tests with Testcontainers (Cassandra, MongoDB)
- [ ] Swagger UI accessible at `/swagger-ui.html`

### Phase 2: Sensor Ingestion Pipeline (Week 3)
- [ ] `sensor` module: Redis Streams consumer, `SensorReading` DTO
- [ ] Simulator: simple scheduled publisher (or separate test container)
- [ ] Stream → Measurement persistence flow (batch insert for throughput)
- [ ] Idempotency: deduplication via `measurement_id` (UUID v7)

### Phase 3: Analytics & Alerts (Week 4)
- [ ] `analytics` module: Scheduled jobs (Spring `@Scheduled` or Quartz)
- [ ] Hourly/daily aggregations written to Cassandra aggregate tables
- [ ] Threshold-based alerting (config in MongoDB, eval in analytics)
- [ ] Alert persistence + REST endpoint

### Phase 4: API Polish & OpenAPI Sync (Week 5)
- [ ] Complete all REST endpoints with validation, pagination, filtering
- [ ] OpenAPI annotations (`@Operation`, `@Parameter`, `@Schema`)
- [ ] Generate frontend TS client: `openapi-typescript-codegen -i http://localhost:8080/v3/api-docs -o frontend/src/api/generated`
- [ ] Add CI step to verify generated types are committed

### Phase 5: Frontend MVP (Weeks 6–7)
- [ ] Layout: sidebar nav, header, responsive
- [ ] Dashboard page: real-time gauge (SSE), latest measurements table
- [ ] Equipment registry: list, create, edit, delete (React Hook Form + Zod)
- [ ] Measurements history: date range picker, sensor selector, chart (Recharts)
- [ ] Alerts page: list, acknowledge, filter by severity
- [ ] Dark mode (Tailwind `darkMode: 'class'`)

### Phase 6: Observability & Hardening (Week 8)
- [ ] Spring Boot Actuator: `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`
- [ ] Micrometer + Prometheus + Grafana (add to docker-compose)
- [ ] Structured logging (Logstash/JSON format), correlation IDs
- [ ] Integration test suite: full stack with Testcontainers
- [ ] Load test: `hey` or `k6` against ingestion endpoint

### Phase 7: Documentation & Delivery (Week 9)
- [ ] ADRs in `docs/architecture/`
- [ ] API documentation (generated + manual)
- [ ] Runbook: deploy, backup, restore, scaling notes
- [ ] Demo script + recorded walkthrough
- [ ] Final cleanup, tag `v1.0.0-mvp`

---

## 10. Immediate Next Steps (Upon Validation)

1. **Confirm Node version strategy** — stay on 26 or switch to 22 LTS?
2. **Choose state management** — Zustand (recommended) or Redux Toolkit?
3. **Choose charting lib** — Recharts (React-native) or Chart.js (canvas)?
4. **Confirm Cassandra version** — 4.1 LTS (safer) or 5.0 (newer features)?
5. **Authentication scope for MVP** — none, basic, or JWT?

---

## Appendix: Quick Command Reference

```bash
# Backend
cd backend
./gradlew build                          # Build all modules
./gradlew :modules:api:bootRun           # Run API module
./gradlew test                           # All tests
./gradlew :modules:measurement:test      # Single module test

# Frontend
cd frontend
npm install
npm run dev                              # Vite dev server
npm run build                            # Production build
npm run typecheck                        # tsc --noEmit
npm run lint                             # eslint
npm run generate:api                     # Generate TS from OpenAPI

# Docker
docker compose up -d                     # Start infra
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d  # Dev mode
docker compose logs -f backend           # Follow logs
docker compose down -v                   # Stop + remove volumes
```

---

**Document Status**: Ready for review. Please validate or request adjustments before implementation begins.