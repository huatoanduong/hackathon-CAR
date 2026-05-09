const API_BASE = '/api';

// Set to true to use mock data without a running backend
const USE_MOCK = true;

const MOCK_VEHICLES = [
  { id: 'vinfast-vf8-plus', name: 'VinFast VF 8 Plus', officialRangeKm: 471 },
  { id: 'vinfast-vf9-plus', name: 'VinFast VF 9 Plus', officialRangeKm: 438 },
  { id: 'tesla-model-3-long-range', name: 'Tesla Model 3 Long Range', officialRangeKm: 548 },
  { id: 'hyundai-ioniq-5-lr', name: 'Hyundai Ioniq 5 Long Range', officialRangeKm: 481 },
  { id: 'byd-atto-3', name: 'BYD Atto 3', officialRangeKm: 420 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePoint(lat1, lng1, lat2, lng2, fraction) {
  return {
    lat: lat1 + (lat2 - lat1) * fraction,
    lng: lng1 + (lng2 - lng1) * fraction,
  };
}

function generateRoutePoints(startLat, startLng, endLat, endLng, numPoints = 60) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    // Add slight curve for realism
    const jitterLat = Math.sin(f * Math.PI) * 0.05 * (Math.random() - 0.3);
    const jitterLng = Math.sin(f * Math.PI) * 0.03 * (Math.random() - 0.5);
    points.push([
      startLng + (endLng - startLng) * f + jitterLng,
      startLat + (endLat - startLat) * f + jitterLat,
    ]);
  }
  return points;
}

// Some known EV charging stations in Vietnam
const MOCK_STATIONS = [
  { id: 'st-001', name: 'VinFast Charging - Phan Rang', lat: 11.5833, lng: 108.9833 },
  { id: 'st-002', name: 'EV Station - Biên Hòa', lat: 10.9500, lng: 106.8333 },
  { id: 'st-003', name: 'VinFast Charging - Bảo Lộc', lat: 11.5478, lng: 107.8112 },
  { id: 'st-004', name: 'EV Station - Long Khánh', lat: 10.9333, lng: 107.2333 },
  { id: 'st-005', name: 'VinFast Charging - Dầu Giây', lat: 10.9000, lng: 107.1833 },
  { id: 'st-006', name: 'EV Station - Phan Thiết', lat: 10.9333, lng: 108.1000 },
  { id: 'st-007', name: 'VinFast Charging - Nha Trang', lat: 12.2388, lng: 109.1967 },
  { id: 'st-008', name: 'EV Station - Cam Ranh', lat: 11.9214, lng: 109.1590 },
  { id: 'st-009', name: 'VinFast Charging - Tuy Hòa', lat: 13.0955, lng: 109.3104 },
  { id: 'st-010', name: 'EV Station - Quy Nhơn', lat: 13.7700, lng: 109.2200 },
  { id: 'st-011', name: 'VinFast Charging - Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { id: 'st-012', name: 'EV Station - Huế', lat: 16.4637, lng: 107.5909 },
  { id: 'st-013', name: 'VinFast Charging - Vinh', lat: 18.6790, lng: 105.6813 },
  { id: 'st-014', name: 'EV Station - Thanh Hóa', lat: 19.8067, lng: 105.7852 },
  { id: 'st-015', name: 'VinFast Charging - Ninh Bình', lat: 20.2506, lng: 105.9745 },
  { id: 'st-016', name: 'EV Station - Hà Nội', lat: 21.0285, lng: 105.8542 },
  { id: 'st-017', name: 'VinFast Charging - Đồng Nai', lat: 10.9476, lng: 106.8231 },
  { id: 'st-018', name: 'EV Station - Tân An', lat: 10.5333, lng: 106.4167 },
  { id: 'st-019', name: 'VinFast Charging - Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { id: 'st-020', name: 'EV Station - Vũng Tàu', lat: 10.3460, lng: 107.0843 },
];

function mockPlanRoute({ start, destination, vehicleModelId, currentBatteryPercent, chargeThresholdPercent }) {
  const vehicle = MOCK_VEHICLES.find((v) => v.id === vehicleModelId) || MOCK_VEHICLES[0];
  const totalDistanceKm = haversineKm(start.lat, start.lng, destination.lat, destination.lng) * 1.3; // road factor
  const rangeKm = vehicle.officialRangeKm;
  const batteryPerKmPercent = 100 / rangeKm;

  const arrivalBattery = currentBatteryPercent - totalDistanceKm * batteryPerKmPercent;

  // Direct route possible
  if (arrivalBattery >= 20) {
    const routeCoords = generateRoutePoints(start.lat, start.lng, destination.lat, destination.lng);
    return {
      routeGeometry: { type: 'LineString', coordinates: routeCoords },
      chargingStops: [],
      legs: [
        {
          from: 'Start',
          to: 'Destination',
          distanceKm: Math.round(totalDistanceKm * 10) / 10,
          estimatedArrivalBatteryPercent: Math.round(arrivalBattery),
        },
      ],
    };
  }

  // Need charging stops
  const chargingStops = [];
  const legs = [];
  let currentLat = start.lat;
  let currentLng = start.lng;
  let currentBattery = currentBatteryPercent;
  let legFrom = 'Start';
  const usedStationIds = new Set();
  let allRouteCoords = [];

  for (let iter = 0; iter < 5; iter++) {
    const remainDist = haversineKm(currentLat, currentLng, destination.lat, destination.lng) * 1.3;
    const arrBattery = currentBattery - remainDist * batteryPerKmPercent;

    if (arrBattery >= 20) {
      const segCoords = generateRoutePoints(currentLat, currentLng, destination.lat, destination.lng, 30);
      allRouteCoords = allRouteCoords.concat(segCoords);
      legs.push({
        from: legFrom,
        to: 'Destination',
        distanceKm: Math.round(remainDist * 10) / 10,
        estimatedArrivalBatteryPercent: Math.round(arrBattery),
      });
      break;
    }

    // Find where battery hits threshold
    const thresholdDist = ((currentBattery - chargeThresholdPercent) / batteryPerKmPercent);
    const fracThreshold = Math.min(thresholdDist / remainDist, 0.9);
    const thresholdPoint = interpolatePoint(currentLat, currentLng, destination.lat, destination.lng, fracThreshold);

    // Find nearest station along the route corridor
    let bestStation = null;
    let bestDist = Infinity;
    for (const st of MOCK_STATIONS) {
      if (usedStationIds.has(st.id)) continue;
      const distToThreshold = haversineKm(thresholdPoint.lat, thresholdPoint.lng, st.lat, st.lng);
      const distFromCurrent = haversineKm(currentLat, currentLng, st.lat, st.lng);
      const distToDest = haversineKm(st.lat, st.lng, destination.lat, destination.lng);
      const directDist = haversineKm(currentLat, currentLng, destination.lat, destination.lng);
      // Station should be between current and destination (no backtracking)
      if (distFromCurrent + distToDest > directDist * 1.5) continue;
      if (distToThreshold < 80 && distToThreshold < bestDist) {
        bestDist = distToThreshold;
        bestStation = st;
      }
    }

    if (!bestStation) {
      // Expand search
      for (const st of MOCK_STATIONS) {
        if (usedStationIds.has(st.id)) continue;
        const distFromCurrent = haversineKm(currentLat, currentLng, st.lat, st.lng);
        const distToDest = haversineKm(st.lat, st.lng, destination.lat, destination.lng);
        const directDist = haversineKm(currentLat, currentLng, destination.lat, destination.lng);
        if (distFromCurrent + distToDest > directDist * 1.5) continue;
        if (distFromCurrent < bestDist) {
          bestDist = distFromCurrent;
          bestStation = st;
        }
      }
    }

    if (!bestStation) {
      // No station found, just route directly
      const segCoords = generateRoutePoints(currentLat, currentLng, destination.lat, destination.lng, 30);
      allRouteCoords = allRouteCoords.concat(segCoords);
      legs.push({
        from: legFrom,
        to: 'Destination',
        distanceKm: Math.round(remainDist * 10) / 10,
        estimatedArrivalBatteryPercent: Math.round(currentBattery - remainDist * batteryPerKmPercent),
      });
      break;
    }

    usedStationIds.add(bestStation.id);
    const distToStation = haversineKm(currentLat, currentLng, bestStation.lat, bestStation.lng) * 1.3;
    const arrBatteryAtStation = currentBattery - distToStation * batteryPerKmPercent;

    const segCoords = generateRoutePoints(currentLat, currentLng, bestStation.lat, bestStation.lng, 20);
    allRouteCoords = allRouteCoords.concat(segCoords);

    chargingStops.push({
      stationId: bestStation.id,
      name: bestStation.name,
      lat: bestStation.lat,
      lng: bestStation.lng,
      batteryBeforeChargingPercent: Math.max(0, Math.round(arrBatteryAtStation)),
      batteryAfterChargingPercent: 80,
      selectionReason: 'Lowest detour time within the safe battery window.',
    });

    legs.push({
      from: legFrom,
      to: bestStation.name,
      distanceKm: Math.round(distToStation * 10) / 10,
      estimatedArrivalBatteryPercent: Math.max(0, Math.round(arrBatteryAtStation)),
    });

    currentLat = bestStation.lat;
    currentLng = bestStation.lng;
    currentBattery = 80;
    legFrom = bestStation.name;
  }

  return {
    routeGeometry: { type: 'LineString', coordinates: allRouteCoords },
    chargingStops,
    legs,
  };
}

export async function fetchVehicles() {
  if (USE_MOCK) return MOCK_VEHICLES;
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function planRoute(params) {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));
    return mockPlanRoute(params);
  }
  const res = await fetch(`${API_BASE}/routes/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Route planning failed');
  }
  return res.json();
}
