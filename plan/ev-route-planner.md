# EV Route Planner Requirements

## Goal

Build an EV route planning app that draws a driving route and automatically adds charging stops based on the user's current battery, selected vehicle model, official vehicle range, and the actual route.

## MVP Inputs

- Start location
- Destination
- Vehicle model
- Current battery percentage
- Charge threshold, defaulting to `30%`

The charge target is fixed at `80%` for the MVP and does not need to be exposed as a primary user setting.

## Core Assumptions

- All EVs are assumed to be compatible with all charging stations.
- Vehicle range is calculated from the official technical specification for each vehicle model.
- Charging time is not included in route calculation.
- After each charging stop, the vehicle is assumed to charge back to `80%`.
- The destination is treated as a special case: if the vehicle can reach the destination with at least `20%` battery remaining, no additional charging stop is required.

## Main Flow

1. Find the fastest route from the current point to the destination.
2. Estimate the battery percentage at arrival using the route distance and the official vehicle range.
3. If the estimated arrival battery is at least `20%`, draw the direct route without adding a charging stop.
4. If the destination cannot be reached with at least `20%` battery:
   - Estimate the location on the route where the battery reaches the charge threshold, defaulting to `30%`.
   - Search for a charging station in the preferred battery window from the threshold down to `20%`.
   - Select a charging station based on real detour time, not straight-line distance.
   - If no valid station is found, expand the search earlier along the route:
     - `40%` to threshold
     - `50%` to `40%`
     - `60%` to `50%`
     - Continue expanding upward until a valid station is found or the current battery limit is reached.
5. Add the selected charging station to the waypoint list.
6. Recalculate the route through the selected charging station.
7. From the charging station, assume the vehicle leaves with `80%` battery.
8. Repeat the process from the charging station to the destination until the destination is reachable with at least `20%` battery.

## Charging Station Selection Rules

- Prefer the station with the lowest real detour time.
- The station should be generally aligned with the forward direction of travel.
- Do not select a charging station that has already been added to the route.
- Do not select a station that causes the route to clearly backtrack.
- If the app selects a station earlier than the charge threshold because no better station is available later, the UI should clearly explain that the stop was selected earlier due to charger availability.

## Outputs

The app should show both a map route and route details.

## System Architecture

The MVP should be built as a Dockerized web application with separate services for the user interface, backend API, background station ingestion, and database.

### Services

- `web`: React + Vite frontend for the map UI, form inputs, pin dropping, and route details.
- `api`: Node.js backend for route planning, charging-station lookup, vehicle data, and shortest-route orchestration.
- `worker`: Node.js background process that runs scheduled charging-station data ingestion.
- `db`: Postgres with PostGIS for storing charging stations, vehicle data, and geospatial indexes.

### Data Flow

1. The user opens the web UI and selects start and destination points on the map.
2. The web UI sends the trip inputs to the backend API.
3. The backend fetches the base driving route from the configured routing provider.
4. The backend estimates battery usage along the route using the selected vehicle model.
5. If charging is needed, the backend queries PostGIS for charging stations near the route corridor and candidate battery windows.
6. The backend evaluates detour time for candidate charging stations and selects the best valid station.
7. The backend recalculates the route with selected charging stops as waypoints.
8. The web UI renders the final route, charging stops, and leg-by-leg battery details.

## Web UI Plan

The web UI should be map-first and support interactive trip planning.

### Frontend Stack

- React + Vite
- Leaflet for the map UI
- OpenStreetMap tiles for the MVP map layer

### Required UI Features

- Full-page map view.
- Drop pin or click-to-select behavior for:
  - Start location
  - Destination
- Draggable markers for adjusting start and destination.
- Vehicle model selector.
- Current battery percentage input.
- Charge threshold input, defaulting to `30%`.
- Plan route button.
- Loading and error states while route calculation is running.
- Visual markers for:
  - Start location
  - Charging stop or stops
  - Destination
- Route polyline showing the complete route with charging waypoints.
- Route detail panel showing each leg and battery estimate.

### UI Behavior

- If the backend returns a direct route, show the route without charging stops.
- If the backend returns charging stops, display each stop in order on both the map and route detail panel.
- If a charging stop is selected earlier than the configured threshold window, show a clear explanation that the stop was selected earlier because no better charger was available later.

## Backend API Plan

The backend should be implemented in Node.js and expose APIs used by the web UI.

### Backend Responsibilities

- Validate trip-planning inputs.
- Fetch or compute shortest driving routes.
- Estimate battery usage from route distance and official vehicle range.
- Search charging stations near route segments.
- Select charging stations by real detour time, not straight-line distance.
- Recalculate routes with charging stations as waypoints.
- Return route geometry, charging stops, leg summaries, and battery estimates.

### MVP API Endpoints

#### `GET /api/vehicles`

Returns supported vehicle models and official range values.

Example response:

```json
[
  {
    "id": "tesla-model-3-long-range",
    "name": "Tesla Model 3 Long Range",
    "officialRangeKm": 548
  }
]
```

#### `GET /api/stations`

Returns charging stations near a coordinate or route corridor.

Supported query parameters:

- `lat`
- `lng`
- `radiusKm`

#### `POST /api/routes/plan`

Plans an EV route from start to destination.

Example request:

```json
{
  "start": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "destination": {
    "lat": 11.9404,
    "lng": 108.4583
  },
  "vehicleModelId": "tesla-model-3-long-range",
  "currentBatteryPercent": 65,
  "chargeThresholdPercent": 30
}
```

Example response:

```json
{
  "routeGeometry": {},
  "chargingStops": [
    {
      "stationId": "station-123",
      "name": "Example Charging Station",
      "lat": 11.2,
      "lng": 107.1,
      "batteryBeforeChargingPercent": 24,
      "batteryAfterChargingPercent": 80,
      "selectionReason": "Lowest detour time within the safe battery window."
    }
  ],
  "legs": [
    {
      "from": "Start",
      "to": "Example Charging Station",
      "distanceKm": 180,
      "estimatedArrivalBatteryPercent": 24
    },
    {
      "from": "Example Charging Station",
      "to": "Destination",
      "distanceKm": 210,
      "estimatedArrivalBatteryPercent": 42
    }
  ]
}
```

## Database Plan

Use Postgres with PostGIS for geospatial storage and charging-station lookup.

### Core Tables

#### `vehicles`

Stores vehicle model range data.

- `id`
- `name`
- `official_range_km`
- `created_at`
- `updated_at`

#### `charging_stations`

Stores normalized charging-station data.

- `id`
- `provider`
- `provider_station_id`
- `name`
- `address`
- `latitude`
- `longitude`
- `location` as a PostGIS `geography(Point, 4326)`
- `source_updated_at`
- `last_seen_at`
- `created_at`
- `updated_at`

### Indexes

- Unique index on `provider` and `provider_station_id`.
- Spatial index on `charging_stations.location`.
- Optional index on `last_seen_at` for ingestion monitoring.

### MVP Data Rules

- All charging stations are treated as compatible with all vehicles.
- Charging power, connector type, and live availability can be stored later but are not required for MVP routing.
- Station records should be upserted during ingestion to avoid duplicates.

## Charging Station Ingestion Cron Plan

The backend should include a scheduled worker process for charging-station data ingestion.

### Worker Responsibilities

- Run on a configurable schedule, such as every 6 or 12 hours.
- Fetch charging-station data from configured source URLs or provider APIs.
- Normalize provider-specific station records into the database schema.
- Upsert charging stations by `provider` and `provider_station_id`.
- Update `last_seen_at` on every successful ingestion.
- Log ingestion count, skipped records, failures, and last successful sync time.

### MVP Ingestion Source

For the first implementation, the worker can use one of these sources:

- A static seed JSON file bundled with the backend.
- A configurable external charging-station data URL.
- A provider API if a reliable source is available.

The plan should support replacing the source later without changing route-planning logic.

## Docker Plan

Everything needed to run the MVP should be defined in Docker.

### Dockerfiles

#### `web/Dockerfile`

- Install frontend dependencies.
- Build the React + Vite app.
- Serve the built static files in a lightweight web server container.

#### `api/Dockerfile`

- Install backend dependencies.
- Build the Node.js backend if TypeScript is used.
- Run the API service by default.
- Reuse the same image for the `worker` service with a different command.

### `docker-compose.yml`

The compose file should define:

- `web`
- `api`
- `worker`
- `db`

### Compose Behavior

- `web` depends on `api`.
- `api` depends on `db`.
- `worker` depends on `db`.
- `db` uses the PostGIS image and persists data in a named Docker volume.
- Environment variables configure database connection, routing provider, station data source, and cron interval.

### Example Compose Environment Variables

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `ROUTING_PROVIDER`
- `ROUTING_BASE_URL`
- `STATION_SOURCE_URL`
- `STATION_INGEST_CRON`

### Local Development Command

The full MVP should run with:

```bash
docker compose up --build
```

### Map View

The map should display one complete route containing:

- Start location
- Charging stop or stops
- Destination

### Route Detail Panel

The route detail panel should show each leg of the trip:

- Leg start point
- Leg end point
- Estimated battery on arrival
- For charging stops:
  - Battery before charging
  - Battery after charging, fixed at `80%`

## Out of Scope for MVP

- Charging connector compatibility
- Charging station power level
- Charging station live availability or operational status
- Charging duration
- Real-world driving efficiency adjustment
- Detailed max charging stop or max iteration handling
- User-selectable route optimization strategy

## Future Enhancements

- Adjust estimated range using real driving data from the user.
- Add a safety buffer based on weather, speed, elevation, traffic, or road type.
- Filter charging stations by connector type, charging power, and live station status.
- Include total trip ETA with charging duration.
- Allow users to customize the charge target instead of always charging to `80%`.
