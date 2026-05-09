const API_BASE = '/api';

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function planRoute({
  start,
  destination,
  vehicleModelId,
  currentBatteryPercent,
  chargeThresholdPercent,
}) {
  const res = await fetch(`${API_BASE}/routes/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start,
      destination,
      vehicleModelId,
      currentBatteryPercent,
      chargeThresholdPercent,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Route planning failed');
  }
  return res.json();
}
