import { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import RouteDetailPanel from './components/RouteDetailPanel';
import {
  buildGoogleMapsDirectionsUrl,
  fetchVehicles,
  planRoute,
  searchPlaces,
} from './services/api';
import './App.css';

const DEFAULT_CENTER = [10.7769, 106.7009]; // Ho Chi Minh City
const HAS_VIETMAP_TILE_KEY = Boolean(
  import.meta.env.VITE_VIETMAP_TILE_API_KEY || import.meta.env.VITE_VIETMAP_API_KEY,
);

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [battery, setBattery] = useState(80);
  const [chargeThreshold, setChargeThreshold] = useState(30);
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [startLabel, setStartLabel] = useState('');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const [placingMode, setPlacingMode] = useState(null); // 'start' | 'destination' | null
  const [routeResult, setRouteResult] = useState(null);
  const [mapProvider, setMapProvider] = useState(
    HAS_VIETMAP_TILE_KEY ? 'vietmap' : 'osm',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const googleMapsUrl = useMemo(
    () =>
      routeResult
        ? buildGoogleMapsDirectionsUrl({
            start,
            destination,
            chargingStops: routeResult.chargingStops,
          })
        : null,
    [destination, routeResult, start],
  );

  useEffect(() => {
    fetchVehicles()
      .then((data) => {
        setVehicles(data);
        if (data.length > 0) setSelectedVehicle(data[0].id);
      })
      .catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStart({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
      setStartLabel('Ho Chi Minh City');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setStart(current);
        setStartLabel('Current location');
      },
      () => {
        setStart({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
        setStartLabel('Ho Chi Minh City');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const handleDestinationSearch = useCallback(async (query) => {
    setPlaceSearchLoading(true);
    setError(null);
    try {
      const results = await searchPlaces(query, { focus: start });
      setPlaceResults(results);
    } catch (err) {
      setPlaceResults([]);
      setError(err.message);
    } finally {
      setPlaceSearchLoading(false);
    }
  }, [start]);

  const handleSelectDestination = useCallback((place) => {
    setDestination({ lat: place.lat, lng: place.lng });
    setDestinationLabel(place.address || place.name);
    setPlaceResults([]);
    setPlacingMode(null);
    setRouteResult(null);
  }, []);

  const handleMapClick = useCallback(
    (latlng) => {
      if (placingMode === 'start') {
        setStart(latlng);
        setStartLabel('Pinned on map');
        setPlacingMode(destination ? null : 'destination');
      } else if (placingMode === 'destination') {
        setDestination(latlng);
        setDestinationLabel('Pinned on map');
        setPlacingMode(null);
      }
    },
    [placingMode, destination],
  );

  const handleMarkerDrag = useCallback((type, latlng) => {
    if (type === 'start') {
      setStart(latlng);
      setStartLabel('Adjusted manually');
    }
    if (type === 'destination') {
      setDestination(latlng);
      setDestinationLabel('Adjusted manually');
    }
    setRouteResult(null);
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser');
      return;
    }

    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStart({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStartLabel('Current location');
        setRouteResult(null);
      },
      () => setError('Could not access current location'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
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
        routingProvider: mapProvider === 'vietmap' ? 'vietmap' : 'osrm',
      });
      setRouteResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [start, destination, selectedVehicle, battery, chargeThreshold, mapProvider]);

  const handleReset = useCallback(() => {
    setStart(null);
    setDestination(null);
    setStartLabel('');
    setDestinationLabel('');
    setPlaceResults([]);
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
        startLabel={startLabel}
        destinationLabel={destinationLabel}
        placeResults={placeResults}
        placeSearchLoading={placeSearchLoading}
        placingMode={placingMode}
        onPlacingModeChange={setPlacingMode}
        onDestinationSearch={handleDestinationSearch}
        onSelectDestination={handleSelectDestination}
        onUseCurrentLocation={handleUseCurrentLocation}
        onPlanRoute={handlePlanRoute}
        onReset={handleReset}
        googleMapsUrl={googleMapsUrl}
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
          mapProvider={mapProvider}
          onMapProviderChange={(provider) => {
            setMapProvider(provider);
            setRouteResult(null);
          }}
          onMapClick={handleMapClick}
          onMarkerDrag={handleMarkerDrag}
        />
        {routeResult && (
          <RouteDetailPanel
            legs={routeResult.legs}
            chargingStops={routeResult.chargingStops}
            googleMapsUrl={googleMapsUrl}
          />
        )}
      </div>
    </div>
  );
}
