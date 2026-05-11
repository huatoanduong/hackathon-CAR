const API_BASE = '/api';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const VIETMAP_BASE = 'https://maps.vietmap.vn/api';
const VIETMAP_SERVICE_API_KEY = import.meta.env.VITE_VIETMAP_SERVICE_API_KEY;

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function planRoute(params) {
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

export function buildGoogleMapsDirectionsUrl({ start, destination, chargingStops = [] }) {
  if (!start || !destination) return null;

  const params = new URLSearchParams({
    api: '1',
    origin: formatLatLng(start),
    destination: formatLatLng(destination),
    travelmode: 'driving',
    dir_action: 'navigate',
  });

  const waypoints = chargingStops
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
    .map((stop) => formatLatLng(stop));

  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function formatLatLng(point) {
  return `${point.lat},${point.lng}`;
}

export async function searchPlaces(query, options = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (VIETMAP_SERVICE_API_KEY) {
    try {
      return await searchPlacesWithVietmap(trimmed, options);
    } catch {
      return searchPlacesWithNominatim(trimmed);
    }
  }

  return searchPlacesWithNominatim(trimmed);
}

async function searchPlacesWithVietmap(query, { focus } = {}) {
  const [globalResults, localResults] = await Promise.all([
    fetchVietmapSearch(query),
    focus ? fetchVietmapSearch(query, focus) : Promise.resolve([]),
  ]);
  const ranked = rankVietmapResults([...globalResults, ...localResults], query);
  const places = await Promise.all(
    ranked.slice(0, 8).map(async (place) => {
      const detail = await fetchVietmapPlace(place.ref_id);
      return {
        id: place.ref_id,
        name: place.name || detail.name || 'Selected place',
        address: place.display || detail.display || place.address || detail.address,
        lat: Number(detail.lat),
        lng: Number(detail.lng),
        provider: 'vietmap',
        kind: getVietmapResultKind(place),
      };
    }),
  );

  return dedupePlaces(
    places.filter(
      (place) => Number.isFinite(place.lat) && Number.isFinite(place.lng),
    ),
  ).slice(0, 6);
}

async function fetchVietmapSearch(query, focus) {
  const params = new URLSearchParams({
    apikey: VIETMAP_SERVICE_API_KEY,
    text: query,
    display_type: '5',
  });
  if (focus) params.set('focus', `${focus.lat},${focus.lng}`);

  const res = await fetch(`${VIETMAP_BASE}/search/v4?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error('Vietmap place search failed');

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchVietmapPlace(refId) {
  const params = new URLSearchParams({
    apikey: VIETMAP_SERVICE_API_KEY,
    refid: refId,
  });

  const res = await fetch(`${VIETMAP_BASE}/place/v4?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error('Vietmap place detail failed');
  return res.json();
}

function rankVietmapResults(results, query) {
  const seen = new Map();
  for (const result of results) {
    if (!result?.ref_id) continue;
    const current = seen.get(result.ref_id);
    if (!current || scoreVietmapResult(result, query) > scoreVietmapResult(current, query)) {
      seen.set(result.ref_id, result);
    }
  }

  return [...seen.values()].sort(
    (a, b) => scoreVietmapResult(b, query) - scoreVietmapResult(a, query),
  );
}

function scoreVietmapResult(place, query) {
  const normalizedQuery = normalizeText(query);
  const normalizedName = normalizeText(place.name);
  const normalizedDisplay = normalizeText(place.display);
  const isAdmin = isAdministrativeResult(place);
  const isPoi = Array.isArray(place.categories) && place.categories.length > 0;
  const distance = Number(place.distance ?? 0);
  let score = 0;

  if (normalizedName === normalizedQuery) score += 900;
  if (normalizedDisplay === normalizedQuery) score += 700;
  if (normalizedName.startsWith(normalizedQuery)) score += 260;
  if (normalizedDisplay.includes(normalizedQuery)) score += 120;
  if (isAdmin) score += 650;
  if (isPoi) score -= 80;
  if (Number.isFinite(distance) && distance > 0) {
    score += Math.max(0, 120 - distance * 4);
  }

  return score;
}

function isAdministrativeResult(place) {
  const kind = getVietmapResultKind(place);
  return kind === 'province' || kind === 'district' || kind === 'ward';
}

function getVietmapResultKind(place) {
  const boundaries = Array.isArray(place.boundaries) ? place.boundaries : [];
  const hasNoPoiCategory = !Array.isArray(place.categories) || place.categories.length === 0;
  const normalizedName = normalizeText(place.name);

  if (!hasNoPoiCategory) return 'poi';
  if (boundaries.length === 1 && boundaries[0]?.type === 0) return 'province';
  if (boundaries.length === 1 && boundaries[0]?.type === 1) return 'district';
  if (boundaries.length === 1 && boundaries[0]?.type === 2) return 'ward';
  if (/^(thanh pho|tinh)\b/.test(normalizedName)) return 'province';
  if (/^(quan|huyen|thi xa)\b/.test(normalizedName)) return 'district';
  if (/^(phuong|xa|thi tran)\b/.test(normalizedName)) return 'ward';
  return 'address';
}

function dedupePlaces(places) {
  const seen = new Set();
  return places.filter((place) => {
    const key = `${normalizeText(place.name)}|${place.lat.toFixed(5)}|${place.lng.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchPlacesWithNominatim(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'vn',
  });
  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error('Place search failed');

  const data = await res.json();
  return data.map((place) => ({
    id: place.place_id,
    name: place.name || place.display_name?.split(',')[0] || 'Selected place',
    address: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    provider: 'nominatim',
  }));
}
