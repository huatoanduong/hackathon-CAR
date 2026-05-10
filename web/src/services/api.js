const API_BASE = '/api';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

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

export async function searchPlaces(query) {
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
  }));
}
