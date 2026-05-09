CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  name text NOT NULL,
  official_range_km integer NOT NULL CHECK (official_range_km > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS charging_stations (
  id serial PRIMARY KEY,
  provider text NOT NULL,
  provider_station_id text NOT NULL,
  name text NOT NULL,
  address text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location geography(Point, 4326) NOT NULL,
  status text,
  raw_payload jsonb NOT NULL,
  source_updated_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS charging_stations_provider_station_unique
  ON charging_stations (provider, provider_station_id);

CREATE INDEX IF NOT EXISTS charging_stations_location_gist_idx
  ON charging_stations USING gist (location);

CREATE INDEX IF NOT EXISTS charging_stations_last_seen_at_idx
  ON charging_stations (last_seen_at);
