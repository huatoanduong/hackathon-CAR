import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import RouteDetailPanel from './components/RouteDetailPanel';
import { fetchVehicles, planRoute } from './services/api';
import './App.css';

const DEFAULT_CENTER = [10.7769, 106.7009]; // Ho Chi Minh City

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [battery, setBattery] = useState(80);
  const [chargeThreshold, setChargeThreshold] = useState(30);
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [placingMode, setPlacingMode] = useState(null); // 'start' | 'destination' | null
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVehicles()
      .then((data) => {
        setVehicles(data);
        if (data.length > 0) setSelectedVehicle(data[0].id);
      })
      .catch(() => setVehicles([]));
  }, []);

  const handleMapClick = useCallback(
    (latlng) => {
      if (placingMode === 'start') {
        setStart(latlng);
        setPlacingMode(destination ? null : 'destination');
      } else if (placingMode === 'destination') {
        setDestination(latlng);
        setPlacingMode(null);
      }
    },
    [placingMode, destination],
  );

  const handleMarkerDrag = useCallback((type, latlng) => {
    if (type === 'start') setStart(latlng);
    if (type === 'destination') setDestination(latlng);
  }, []);

  const handlePlanRoute = useCallback(async () => {
    if (!start || !destination || !selectedVehicle) return;
    setLoading(true);
    setError(null);
    setRouteResult(null);
    try {
      const result = await planRoute({
        start: { lat: start.lat, lng: start.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        vehicleModelId: selectedVehicle,
        currentBatteryPercent: battery,
        chargeThresholdPercent: chargeThreshold,
      });
      setRouteResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [start, destination, selectedVehicle, battery, chargeThreshold]);

  const handleReset = useCallback(() => {
    setStart(null);
    setDestination(null);
    setRouteResult(null);
    setError(null);
    setPlacingMode(null);
  }, []);

  return (
    <div className="app">
      <ControlPanel
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onVehicleChange={setSelectedVehicle}
        battery={battery}
        onBatteryChange={setBattery}
        chargeThreshold={chargeThreshold}
        onChargeThresholdChange={setChargeThreshold}
        start={start}
        destination={destination}
        placingMode={placingMode}
        onPlacingModeChange={setPlacingMode}
        onPlanRoute={handlePlanRoute}
        onReset={handleReset}
        loading={loading}
        error={error}
      />
      <div className="app__main">
        <MapView
          center={DEFAULT_CENTER}
          start={start}
          destination={destination}
          chargingStops={routeResult?.chargingStops || []}
          routeGeometry={routeResult?.routeGeometry || null}
          placingMode={placingMode}
          onMapClick={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
        />
        {routeResult && (
          <RouteDetailPanel
            legs={routeResult.legs}
            chargingStops={routeResult.chargingStops}
          />
        )}
      </div>
    </div>
  );
}
