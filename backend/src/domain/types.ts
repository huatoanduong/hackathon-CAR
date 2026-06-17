export type Coordinate = {
  lat: number;
  lng: number;
};

export type Vehicle = {
  id: string;
  name: string;
  officialRangeKm: number;
};

export type ChargingStation = {
  id: string;
  provider: string;
  providerStationId: string;
  name: string;
  address: string | null;
  accessInfo?: string | null;
  connectorSummary?: string | null;
  connectorCount?: number | null;
  maxPowerKw?: number | null;
  powerLevelsKw?: number[];
  lat: number;
  lng: number;
  status: string | null;
  distanceKm?: number;
  routeProgressKm?: number;
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RoutingRoute = {
  distanceKm: number;
  durationSeconds: number;
  geometry: RouteGeometry;
  legs?: Array<{
    distanceKm: number;
    durationSeconds: number;
  }>;
};

export type RouteLeg = {
  from: string;
  to: string;
  distanceKm: number;
  estimatedArrivalBatteryPercent: number;
};

export type ChargingStop = {
  stationId: string;
  name: string;
  address?: string | null;
  status?: string | null;
  accessInfo?: string | null;
  connectorSummary?: string | null;
  connectorCount?: number | null;
  maxPowerKw?: number | null;
  powerLevelsKw?: number[];
  lat: number;
  lng: number;
  batteryBeforeChargingPercent: number;
  batteryAfterChargingPercent: number;
  selectionReason?: string;
};

export type PlanRouteInput = {
  start: Coordinate;
  destination: Coordinate;
  vehicleModelId: string;
  currentBatteryPercent: number;
  chargeThresholdPercent: number;
  routingProvider?: "osrm" | "vietmap";
};

export type PlanRouteResult = {
  routeGeometry: RouteGeometry;
  chargingStops: ChargingStop[];
  legs: RouteLeg[];
  summary: {
    totalDistanceKm: number;
    totalDurationSeconds: number;
    chargingStopCount: number;
  };
  warnings: string[];
};

export type SearchWindow = {
  minBatteryPercent: number;
  maxBatteryPercent: number;
  preferred: boolean;
};

export type RouteCandidate = {
  station: ChargingStation;
  detourDurationSeconds: number;
  routeProgressKm: number;
  batteryBeforeChargingPercent: number;
  selectedEarlierThanThreshold: boolean;
  emergencyLowBattery?: boolean;
};
