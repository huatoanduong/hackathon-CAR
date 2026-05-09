import {
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point,4326)";
  }
});

export const vehicles = pgTable("vehicles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  officialRangeKm: integer("official_range_km").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const chargingStations = pgTable(
  "charging_stations",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    providerStationId: text("provider_station_id").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    location: geographyPoint("location").notNull(),
    status: text("status"),
    rawPayload: jsonb("raw_payload").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("charging_stations_provider_station_unique").on(
      table.provider,
      table.providerStationId
    ),
    index("charging_stations_last_seen_at_idx").on(table.lastSeenAt)
  ]
);
