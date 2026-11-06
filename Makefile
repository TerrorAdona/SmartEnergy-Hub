# SmartEnergy Hub - Makefile
# Common development commands

.PHONY: help up down down-v build build-api run-api test test-unit test-integration clean logs logs-% frontend-install frontend-dev frontend-build frontend-test frontend-lint generate-api simulate docker-build docker-push status restart

ifeq ($(OS),Windows_NT)
GRADLEW = gradlew.bat
else
GRADLEW = ./gradlew
endif

# Default target
help:
	@echo "SmartEnergy Hub - Development Commands"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make up              - Start all infrastructure (Cassandra, MongoDB, Redis, Prometheus, Grafana)"
	@echo "  make down            - Stop all infrastructure"
	@echo "  make down-v          - Stop infrastructure and remove volumes"
	@echo "  make logs            - Follow logs for all services"
	@echo "  make logs-%          - Follow logs for specific service (e.g., make logs-cassandra)"
	@echo ""
	@echo "Backend:"
	@echo "  make build           - Build all backend modules"
	@echo "  make build-api       - Build only API module"
	@echo "  make run-api         - Run API module (Spring Boot)"
	@echo "  make simulate        - Run sensor simulator (set SIMULATOR_ARGS)"
	@echo "  make test            - Run all backend tests"
	@echo "  make test-unit       - Run unit tests only"
	@echo "  make test-integration - Run integration tests only"
	@echo "  make clean           - Clean build artifacts"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-install - Install frontend dependencies"
	@echo "  make frontend-dev    - Start frontend dev server"
	@echo "  make frontend-build  - Build frontend for production"
	@echo "  make frontend-test   - Run frontend tests"
	@echo "  make frontend-lint   - Lint frontend code"
	@echo ""
	@echo "API Generation:"
	@echo "  make generate-api    - Generate TypeScript client from OpenAPI spec"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build    - Build all Docker images"
	@echo "  make docker-push     - Push Docker images (requires registry)"

# Infrastructure
up:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

down:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down

down-v:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down -v

logs:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f

logs-%:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f $*

# Backend
build:
	cd backend && $(GRADLEW) build -x test

build-api:
	cd backend && $(GRADLEW) :modules:api:build -x test

run-api:
	cd backend && $(GRADLEW) :modules:api:bootRun --args='--spring.profiles.active=dev'

simulate:
	node tools/sensor-simulator.mjs $(SIMULATOR_ARGS)

test:
	cd backend && $(GRADLEW) test

test-unit:
	cd backend && $(GRADLEW) test --tests "*UnitTest*"

test-integration:
	cd backend && $(GRADLEW) test --tests "*IntegrationTest*"

clean:
	cd backend && $(GRADLEW) clean

# Frontend
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test -- --run

frontend-lint:
	cd frontend && npm run lint

# API Generation
generate-api:
	@echo "Generating TypeScript client from OpenAPI spec..."
	cd frontend && npm run generate:api

# Docker
docker-build:
	docker build -t smartenergy/backend:latest -f backend/Dockerfile backend/
	docker build -t smartenergy/frontend:latest -f frontend/Dockerfile frontend/

docker-push:
	docker push smartenergy/backend:latest
	docker push smartenergy/frontend:latest

# Utility
status:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml ps

restart:
	$(MAKE) down
	$(MAKE) up