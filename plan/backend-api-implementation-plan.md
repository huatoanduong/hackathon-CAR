# Backend API Implementation Plan

## Summary

Review result: the current **Backend API Plan** defines the right responsibilities and endpoints, but it is not implementation-ready yet. It is missing stack choices, folder structure, routing-provider integration, database/migration strategy, station ingestion details, route-planning algorithm boundaries, error contracts, and test coverage.

Implement a new TypeScript Fastify backend in `backend`, plus root `docker-compose.yml` wiring because that was explicitly selected. The backend will include two entrypoints: `api` and `worker`.

Chosen defaults:

- Stack: TypeScript + Fastify + Zod + Drizzle
- Database: Postgres + PostGIS
- Routing: OSRM-compatible HTTP API via `ROUTING_BASE_URL`
- Stations: seed from `data/ev-stations.raw.json`
- Vehicles: fixed seed records inserted into database; API reads from database
- Geometry response: GeoJSON `LineString`

## File-by-file Implementation Map

### Root Files

#### `docker-compose.yml`

Create this file at the repository root.

Changes included:

- Define `db` using a PostGIS image, for example `postgis/postgis:16-3.4`.
- Define `api` using `backend/Dockerfile`.
- Define `worker` using the same backend image but override the command to run the worker entrypoint.
- Add a named Postgres volume, for example `postgres_data`.
- Configure shared environment variables:
  - `DATABASE_URL`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `ROUTING_BASE_URL`
  - `ROUTING_TIMEOUT_MS`
  - `STATION_SEARCH_RADIUS_KM`
  - `ROUTE_CORRIDOR_RADIUS_KM`
  - `STATION_INGEST_CRON`
- Make `api` and `worker` depend on `db`.
- Expose API port `3000:3000`.
- Do not add the future frontend service yet unless the `web` folder exists.

#### `.env.example`

Create or update this file at the repository root.

Changes included:

- Document all environment variables required by Compose and backend local development.
- Include safe local defaults:
  - `POSTGRES_DB=ev_route_planner`
  - `POSTGRES_USER=ev_app`
  - `POSTGRES_PASSWORD=ev_app_password`
  - `DATABASE_URL=postgres://ev_app:ev_app_password@db:5432/ev_route_planner`
  - `PORT=3000`
  - `HOST=0.0.0.0`
  - `ROUTING_BASE_URL=http://router.project-osrm.org`
  - `ROUTING_TIMEOUT_MS=10000`
  - `STATION_SEARCH_RADIUS_KM=5`
  - `ROUTE_CORRIDOR_RADIUS_KM=3`
  - `STATION_INGEST_CRON=0 */6 * * *`

### Backend Package Files

#### `backend/package.json`

Create the backend package manifest.

Changes included:

- Set package type to ESM or configure TypeScript consistently. Recommended: `"type": "module"`.
- Add runtime dependencies:
  - `@fastify/cors`
  - `@fastify/sensible`
  - `dotenv`
  - `drizzle-orm`
  - `fastify`
  - `node-cron`
  - `pg`
  - `zod`
- Add development dependencies:
  - `@types/node`
  - `@types/pg`
  - `drizzle-kit`
  - `tsx`
  - `typescript`
  - `vitest`
- Add scripts:
  - `dev`: `tsx watch src/api/server.ts`
  - `build`: `tsc -p tsconfig.json`
  - `start`: `node dist/api/server.js`
  - `worker`: `node dist/worker/index.js`
  - `db:generate`: `drizzle-kit generate`
  - `db:migrate`: `tsx src/db/migrate.ts`
  - `db:seed`: `tsx src/db/seed.ts`
  - `test`: `vitest run`

#### `backend/tsconfig.json`

Create TypeScript compiler configuration.

Changes included:

- Compile `src` to `dist`.
- Use strict TypeScript.
- Use Node-compatible module resolution.
- Include test files for type-checking only if needed.

#### `backend/drizzle.config.ts`

Create Drizzle Kit configuration.

Changes included:

- Point schema to `src/db/schema.ts`.
- Output migrations to `src/db/migrations`.
- Read `DATABASE_URL` from environment.
- Configure Postgres dialect.

#### `backend/Dockerfile`

Create a Dockerfile for API and worker.

Changes included:

- Use a Node LTS base image.
- Install backend dependencies.
- Copy backend source and root `data/ev-stations.raw.json` into the image or mount it through Compose.
- Build TypeScript.
- Default command runs the API: `node dist/api/server.js`.
- Allow Compose worker command override: `node dist/worker/index.js`.

#### `backend/.dockerignore`

Create Docker ignore rules.

Changes included:

- Exclude `node_modules`, `dist`, coverage, local env files, and logs.
- Keep source, migrations, package files, and required station seed data available to the build context.

#### `backend/README.md`

Create backend-specific setup notes.

Changes included:

- Explain local install, build, test, migration, and seed commands.
- Document required env variables.
- Document the API endpoints and example requests.
- Document that station data currently comes from `data/ev-stations.raw.json`.

### Backend Source Files

#### `backend/src/config/env.ts`

Create environment parsing.

Changes included:

- Load `.env` using `dotenv`.
- Validate env variables with Zod.
- Export a typed `env` object.
- Apply defaults for local development:
  - `PORT=3000`
  - `HOST=0.0.0.0`
  - `ROUTING_TIMEOUT_MS=10000`
  - `STATION_SEARCH_RADIUS_KM=5`
  - `ROUTE_CORRIDOR_RADIUS_KM=3`
- Fail fast if `DATABASE_URL` or `ROUTING_BASE_URL` is missing.

#### `backend/src/api/server.ts`

Create API process entrypoint.

Changes included:

- Build the Fastify app using `buildApp`.
- Listen on `env.HOST` and `env.PORT`.
- Handle startup failure by logging and exiting with code `1`.
- Handle graceful shutdown on `SIGINT` and `SIGTERM`.

#### `backend/src/api/app.ts`

Create Fastify app factory.

Changes included:

- Register CORS.
- Register sensible HTTP errors.
- Register shared error handler.
- Register route modules:
  - health routes
  - vehicle routes
  - station routes
  - route-planning routes
- Decorate or inject service dependencies in a testable way.

#### `backend/src/api/errors.ts`

Create centralized HTTP error mapping.

Changes included:

- Define domain error classes or error codes:
  - `ValidationError`
  - `NotFoundError`
  - `RoutePlanningError`
  - `RoutingProviderError`
- Map errors to JSON responses:
  - `400` invalid input
  - `404` missing vehicle
  - `422` unsafe or impossible route
  - `502` OSRM/provider failure
  - `500` unexpected failure
- Ensure responses include `error.code` and `error.message`.

#### `backend/src/api/routes/health.ts`

Create health endpoint.

Changes included:

- Add `GET /health`.
- Query the database with a lightweight `select 1`.
- Return `{ status: "ok", database: "ok" }` when healthy.
- Return a `503` style error if database connectivity fails.

#### `backend/src/api/routes/vehicles.ts`

Create vehicle endpoint.

Changes included:

- Add `GET /api/vehicles`.
- Call vehicle repository/service.
- Return vehicles sorted by name.
- Map database `official_range_km` to API `officialRangeKm`.

#### `backend/src/api/routes/stations.ts`

Create stations endpoint.

Changes included:

- Add `GET /api/stations`.
- Validate query params:
  - `lat`: -90 to 90
  - `lng`: -180 to 180
  - `radiusKm`: positive, default from env
- Call station repository radius search.
- Return normalized station records.
- Limit result count to prevent very large responses.

#### `backend/src/api/routes/routePlan.ts`

Create route-planning endpoint.

Changes included:

- Add `POST /api/routes/plan`.
- Validate request body with Zod.
- Default `chargeThresholdPercent` to `30`.
- Call `RoutePlannerService.planRoute`.
- Return the response shape needed by the web UI:
  - `routeGeometry`
  - `chargingStops`
  - `legs`
  - `summary`
  - `warnings`

#### `backend/src/api/schemas/common.ts`

Create reusable HTTP schemas.

Changes included:

- Define coordinate schema.
- Define percentage schema.
- Define GeoJSON `LineString` response type.
- Define shared error response schema if Fastify schema validation is used.

#### `backend/src/api/schemas/routePlan.ts`

Create route-plan request and response schemas.

Changes included:

- Define `PlanRouteRequestSchema`.
- Define `PlanRouteResponseSchema`.
- Export TypeScript inferred types for API handlers.

#### `backend/src/db/client.ts`

Create database client.

Changes included:

- Create `pg` Pool using `env.DATABASE_URL`.
- Create Drizzle database instance.
- Export `db` and `pool`.
- Provide `closeDb` for tests and graceful shutdown.

#### `backend/src/db/schema.ts`

Create Drizzle table schema.

Changes included:

- Define `vehicles` table.
- Define `chargingStations` table.
- Include timestamps.
- Include unique index on `provider` and `provider_station_id`.
- Include spatial index declaration where Drizzle supports it.
- For PostGIS `geography(Point, 4326)`, use raw SQL migration if Drizzle schema support is limited.

#### `backend/src/db/migrations/0001_init.sql`

Create initial migration.

Changes included:

- Enable PostGIS extension: `CREATE EXTENSION IF NOT EXISTS postgis`.
- Create `vehicles`.
- Create `charging_stations`.
- Create GIST index on `charging_stations.location`.
- Create unique provider station index.
- Create `last_seen_at` index.

#### `backend/src/db/migrate.ts`

Create migration runner.

Changes included:

- Load env.
- Run Drizzle migrations from `src/db/migrations`.
- Close the database pool on completion.
- Exit with non-zero code on failure.

#### `backend/src/db/seed.ts`

Create seed command.

Changes included:

- Seed fixed vehicle list.
- Read `../data/ev-stations.raw.json` from the repo root when run locally.
- Normalize station records through the station ingestion parser.
- Upsert stations into database.
- Print counts for vehicles, stations inserted, stations updated, and skipped station rows.

#### `backend/src/db/seeds/vehicles.ts`

Create fixed MVP vehicle data.

Changes included:

- Export an array of supported vehicles.
- Include stable ids, display names, and official range in km.
- Use database upsert so the seed is safe to run repeatedly.
- Recommended starting list:
  - `tesla-model-3-long-range`
  - `vinfast-vf8-eco`
  - `vinfast-vf9-eco`
  - `hyundai-ioniq-5-long-range`

#### `backend/src/db/repositories/vehicleRepository.ts`

Create vehicle database access.

Changes included:

- `listVehicles()`
- `findVehicleById(id)`
- Map database rows to domain vehicle objects.

#### `backend/src/db/repositories/stationRepository.ts`

Create station database access.

Changes included:

- `findStationsNearPoint({ lat, lng, radiusKm, limit })`
- `findStationsNearRoutePoints({ points, radiusKm, excludeStationIds, limit })`
- `upsertStations(stations)`
- Use raw SQL for PostGIS:
  - `ST_DWithin`
  - `ST_MakePoint`
  - `ST_SetSRID`
  - `ST_Distance`
- Sort nearby stations by distance.

#### `backend/src/domain/types.ts`

Create shared domain types.

Changes included:

- `Coordinate`
- `Vehicle`
- `ChargingStation`
- `RouteGeometry`
- `RouteLeg`
- `ChargingStop`
- `PlanRouteInput`
- `PlanRouteResult`
- `RouteCandidate`

#### `backend/src/domain/battery.ts`

Create battery calculation helpers.

Changes included:

- `estimateBatteryUsedPercent(distanceKm, officialRangeKm)`
- `estimateArrivalBatteryPercent(startBatteryPercent, distanceKm, officialRangeKm)`
- `distanceReachableKm(startBatteryPercent, targetBatteryPercent, officialRangeKm)`
- Clamp/round percentages consistently for API output.

#### `backend/src/domain/routeGeometry.ts`

Create route geometry helpers.

Changes included:

- Calculate cumulative route distance along GeoJSON coordinates.
- Find route point where a target battery percentage is reached.
- Extract route segments between progress windows.
- Convert OSRM coordinates into backend coordinate objects.

#### `backend/src/domain/searchWindows.ts`

Create charging search window logic.

Changes included:

- Build the first window from `chargeThresholdPercent` down to `20`.
- Build fallback windows earlier on route:
  - `40` to threshold
  - `50` to `40`
  - `60` to `50`
  - continue until current battery limit.
- Mark whether each window is preferred or fallback.

#### `backend/src/domain/stationSelection.ts`

Create station candidate selection logic.

Changes included:

- Filter already selected stations.
- Filter candidates that are behind the route progress.
- Request OSRM detour evaluation for candidates.
- Sort by real detour duration.
- Return selected station with:
  - detour duration
  - route progress
  - selection reason
  - whether it was selected earlier than threshold.

#### `backend/src/domain/routePlanner.ts`

Create main route planner service.

Changes included:

- Coordinate all route-planning steps:
  - load vehicle
  - fetch direct route
  - calculate battery usage
  - search station windows
  - select stop
  - recalculate route with waypoints
  - build response legs
- Enforce destination success threshold of `20%`.
- Enforce post-charge battery of `80%`.
- Enforce max planning iterations to avoid infinite loops.
- Throw clear domain errors when route planning is impossible.

#### `backend/src/providers/osrmClient.ts`

Create OSRM provider client.

Changes included:

- Build OSRM `/route/v1/driving/{coordinates}` requests.
- Request `overview=full`, `geometries=geojson`, and step-free route response.
- Parse distance meters to km.
- Parse duration seconds.
- Return a typed route object.
- Support ordered waypoint routes.
- Map provider/network failures to `RoutingProviderError`.

#### `backend/src/providers/routingProvider.ts`

Create provider interface.

Changes included:

- Define a routing abstraction used by domain services.
- Include:
  - `getRoute(points)`
  - `getDetourRoute(baseRoute, candidateStation)` or equivalent route comparison method.
- Keep OSRM swappable later without changing route-planning logic.

#### `backend/src/worker/index.ts`

Create worker process entrypoint.

Changes included:

- Load env.
- Run one ingestion immediately on startup.
- Schedule repeated ingestion with `node-cron`.
- Log each run result.
- Handle shutdown cleanly.

#### `backend/src/worker/stationIngestion.ts`

Create station ingestion service.

Changes included:

- Read station source through a source adapter.
- Normalize station records.
- Upsert into database through station repository.
- Return ingestion summary:
  - read count
  - normalized count
  - skipped count
  - inserted/updated count if available
  - errors

#### `backend/src/worker/sources/localStationJsonSource.ts`

Create local JSON station source.

Changes included:

- Read `data/ev-stations.raw.json`.
- Validate the top-level shape has `stations`.
- Return raw station records.
- Keep path configurable for tests.

#### `backend/src/worker/normalizers/googleMyMapsStationNormalizer.ts`

Create normalizer for current station dataset.

Changes included:

- Convert raw KML-export station records into database-ready station objects.
- Use:
  - `source_index` as provider station id
  - `name`
  - `coordinates.lat`
  - `coordinates.lng`
  - address from `extendedData["Địa chỉ:"]`
  - status from `extendedData["Trạng thái:"]`
  - source updated date from note if parseable, otherwise null
  - original raw object as `raw_payload`
- Skip records with missing name or coordinates.

#### `backend/src/utils/geo.ts`

Create geospatial utility helpers.

Changes included:

- Haversine distance for quick local checks.
- Coordinate validation helpers.
- Meters/km conversion helpers.

#### `backend/src/utils/logger.ts`

Create lightweight logging helper.

Changes included:

- Provide structured console logging helpers for API and worker.
- Include timestamp, level, message, and optional metadata.
- Avoid adding a heavy logging dependency for MVP.

### Backend Tests

#### `backend/test/battery.test.ts`

Create battery unit tests.

Changes included:

- Verify battery consumption from range and distance.
- Verify arrival battery calculation.
- Verify reachable distance calculation.
- Verify clamping/rounding behavior.

#### `backend/test/searchWindows.test.ts`

Create charging window tests.

Changes included:

- Verify preferred threshold window.
- Verify fallback windows expand earlier.
- Verify windows stop at current battery limit.

#### `backend/test/stationNormalizer.test.ts`

Create station parser tests.

Changes included:

- Use sample records from `data/ev-stations.raw.json`.
- Verify address, status, coordinates, provider id, and raw payload mapping.
- Verify invalid records are skipped.

#### `backend/test/osrmClient.test.ts`

Create provider parsing tests.

Changes included:

- Mock OSRM HTTP responses.
- Verify distance, duration, and geometry parsing.
- Verify provider error handling.

#### `backend/test/apiRoutes.test.ts`

Create API route tests.

Changes included:

- Build Fastify app in-memory.
- Test input validation for route planning.
- Test `GET /api/vehicles` response mapping.
- Test route-planning handler with mocked services.

#### `backend/test/routePlanner.test.ts`

Create route-planner service tests.

Changes included:

- Test direct route when arrival battery is safe.
- Test one-stop route when destination is not reachable.
- Test fallback station selection before threshold.
- Test impossible route error.

## Key Changes

### Backend Package

Create a new `backend` Node package with:

- `package.json` scripts:
  - `dev`: run API in watch mode
  - `build`: compile TypeScript
  - `start`: run compiled API
  - `worker`: run compiled worker
  - `db:migrate`: apply Drizzle migrations
  - `db:seed`: seed vehicles and bundled station data
  - `test`: run Vitest
- TypeScript config, lint-friendly source layout, and environment validation.
- `backend/Dockerfile` supporting both API and worker commands.

Core folders:

- `src/api`: Fastify app, routes, HTTP schemas, error handling
- `src/config`: env parsing and runtime configuration
- `src/db`: Drizzle client, schema, migrations, seed commands
- `src/domain`: route planning, battery math, station selection
- `src/providers`: OSRM client
- `src/worker`: station ingestion worker
- `src/utils`: geo helpers, pagination, numeric helpers
- `test`: unit and integration tests

### Public API

Add these endpoints:

- `GET /health`
  - Returns service status and database connectivity.
- `GET /api/vehicles`
  - Reads seeded vehicles from database.
  - Returns `id`, `name`, `officialRangeKm`.
- `GET /api/stations`
  - Query params: `lat`, `lng`, `radiusKm`.
  - Validates coordinate bounds and radius.
  - Uses PostGIS radius search.
  - Returns station id, name, address, lat/lng, provider, status metadata.
- `POST /api/routes/plan`
  - Request:
    - `start.lat`, `start.lng`
    - `destination.lat`, `destination.lng`
    - `vehicleModelId`
    - `currentBatteryPercent`
    - optional `chargeThresholdPercent`, default `30`
  - Response:
    - `routeGeometry`: GeoJSON `LineString`
    - `chargingStops`
    - `legs`
    - `summary`
    - `warnings`
  - Errors:
    - `400` invalid input
    - `404` unknown vehicle
    - `422` route cannot be planned safely
    - `502` OSRM unavailable or malformed provider response

### Database

Create Drizzle schema and migrations for:

- `vehicles`
  - `id`, `name`, `official_range_km`, `created_at`, `updated_at`
- `charging_stations`
  - `id`, `provider`, `provider_station_id`, `name`, `address`
  - `latitude`, `longitude`
  - `location geography(Point, 4326)`
  - `status`, `raw_payload`
  - `source_updated_at`, `last_seen_at`, `created_at`, `updated_at`

Indexes:

- Unique index on `provider`, `provider_station_id`
- Spatial GIST index on `location`
- Index on `last_seen_at`

Seed behavior:

- Vehicle seed inserts a small fixed list and upserts by `id`.
- Station seed reads `../data/ev-stations.raw.json`, normalizes Vietnamese KML fields, and upserts by provider plus source index.
- API always reads vehicles and stations from DB, so future DB-managed data does not require API changes.

### Routing Provider

Add an OSRM client that supports:

- Route from ordered coordinates.
- Distance and duration extraction.
- GeoJSON geometry return.
- Candidate detour evaluation using route calls.
- Timeout, retry limit, and provider error mapping.

Environment variables:

- `DATABASE_URL`
- `PORT`
- `HOST`
- `ROUTING_BASE_URL`
- `ROUTING_TIMEOUT_MS`
- `STATION_SEARCH_RADIUS_KM`
- `ROUTE_CORRIDOR_RADIUS_KM`
- `STATION_INGEST_CRON`
- `NODE_ENV`

### Route Planning Algorithm

Implement route planning as a service, separate from HTTP handlers.

Flow:

1. Validate request with Zod.
2. Load vehicle by `vehicleModelId`.
3. Fetch direct OSRM route from start to destination.
4. Estimate arrival battery using route distance and official range.
5. If arrival battery is at least `20%`, return direct route with no stops.
6. If charging is needed:
   - Walk the route geometry with cumulative distance.
   - Compute where battery reaches each search window.
   - First search from `chargeThresholdPercent` down to `20%`.
   - If no station is valid, expand earlier:
     - `40%` to threshold
     - `50%` to `40%`
     - `60%` to `50%`
     - continue up to current available battery.
7. Query PostGIS for stations near route points in the active window.
8. Reject stations already selected.
9. Evaluate candidates with OSRM detour routes:
   - current point to station
   - station to destination or next route target
   - compare against direct route duration
10. Select the station with lowest valid real detour time.
11. Add the stop, assume battery after charging is `80%`.
12. Recalculate route through all selected stops.
13. Repeat until destination arrival battery is at least `20%`.
14. Use a simple safety guard to prevent infinite loops and return `422` if no safe plan exists.

Station selection rules:

- Prefer lowest OSRM detour duration.
- Require station to be forward along route progress.
- Reject obvious backtracking by checking that station insertion does not significantly reduce route progress.
- Mark `selectionReason` as normal threshold-window selection or earlier fallback selection.

### Worker

Add a worker entrypoint under `backend`:

- Runs immediately on startup unless disabled.
- Reads bundled station JSON for MVP ingestion.
- Upserts station records.
- Logs inserted, updated, skipped, and failed counts.
- Supports cron scheduling through `STATION_INGEST_CRON`.
- Keeps provider abstraction so later KML/API ingestion can replace bundled JSON without changing route-planning code.

### Docker

Add:

- `backend/Dockerfile`
  - builds TypeScript
  - runs API by default
  - supports worker command override
- Root `docker-compose.yml`
  - `api`
  - `worker`
  - `db` using PostGIS image
  - optional placeholder-ready network for future `web`

Compose behavior:

- `api` depends on `db`
- `worker` depends on `db`
- `db` persists data in a named volume
- API and worker share the same backend image
- Environment variables are configured through compose defaults and `.env`

## Test Plan

Unit tests:

- Battery percentage math from route distance and official range.
- Route-window calculation for threshold and fallback windows.
- Station normalization from `ev-stations.raw.json`.
- Candidate rejection for duplicate stations and unreachable stations.
- Zod request validation.

Integration tests:

- `GET /api/vehicles` returns seeded vehicles.
- `GET /api/stations` returns nearby stations using PostGIS.
- `POST /api/routes/plan` returns direct route when battery is enough.
- `POST /api/routes/plan` returns charging stops when battery is insufficient.
- OSRM failure maps to `502`.
- No reachable station maps to `422`.

Provider tests:

- Mock OSRM route responses.
- Verify route geometry, distance, and duration parsing.
- Verify detour sorting uses OSRM duration, not straight-line distance.

Docker smoke test:

- `docker compose up --build`
- Run migrations and seed.
- Call `/health`, `/api/vehicles`, `/api/stations`, and one route-planning request.

## Assumptions

- Start and destination are map coordinates; backend will not implement geocoding.
- All vehicles are compatible with all stations for MVP.
- Charge target is fixed at `80%`.
- Destination is acceptable when arrival battery is at least `20%`.
- Charging duration is not included in travel-time optimization.
- Root `docker-compose.yml` is allowed even though most implementation changes live in `backend`.
- Existing Python station fetch script remains untouched; backend uses the existing raw JSON snapshot first.
