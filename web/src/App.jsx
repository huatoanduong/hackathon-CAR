import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import MapSidebar from './components/MapSidebar';
import RouteDetailPanel from './components/RouteDetailPanel';
import {
  buildGoogleMapsDirectionsUrl,
  fetchStationsNear,
  fetchVehicles,
  planRoute,
  searchPlaces,
} from './services/api';
import './App.css';

const DEFAULT_CENTER = [10.7769, 106.7009]; // Ho Chi Minh City
const RECENT_ROUTES_KEY = 'tmap.recentRoutes.v1';
const MAX_RECENT_ROUTES = 6;

function loadRecentRoutes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_ROUTES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentRoutes(routes) {
  localStorage.setItem(RECENT_ROUTES_KEY, JSON.stringify(routes));
}

function routePointKey(point) {
  return point ? `${point.lat.toFixed(5)},${point.lng.toFixed(5)}` : '';
}

function routeTitle(startLabel, destinationLabel) {
  return `${startLabel || 'Start'} to ${destinationLabel || 'Destination'}`;
}

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
  const placeSearchRequestRef = useRef(0);
  const stationRequestRef = useRef(0);
  const [stations, setStations] = useState([]);
  const [recentRoutes, setRecentRoutes] = useState(loadRecentRoutes);
  const [placingMode, setPlacingMode] = useState(null); // 'start' | 'destination' | null
  const [routeResult, setRouteResult] = useState(null);
  const [mapProvider, setMapProvider] = useState('osm');
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
    const requestId = stationRequestRef.current + 1;
    stationRequestRef.current = requestId;
    const points = [start, destination].filter(Boolean);
    const lookupPoints = points.length > 0
      ? points
      : [{ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }];

    Promise.all(lookupPoints.map((point) => fetchStationsNear(point, 100)))
      .then((groups) => {
        if (stationRequestRef.current !== requestId) return;
        const seen = new Set();
        const merged = groups.flat().filter((station) => {
          const key = station.id || `${station.lat},${station.lng}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setStations(merged);
      })
      .catch(() => {
        if (stationRequestRef.current === requestId) setStations([]);
      });
  }, [destination, start]);

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
    const requestId = placeSearchRequestRef.current + 1;
    placeSearchRequestRef.current = requestId;
    setPlaceSearchLoading(true);
    setError(null);
    try {
      const results = await searchPlaces(query, { focus: start });
      if (placeSearchRequestRef.current === requestId) {
        setPlaceResults(results);
      }
      return results;
    } catch (err) {
      if (placeSearchRequestRef.current === requestId) {
        setPlaceResults([]);
        setError(err.message);
      }
      return [];
    } finally {
      if (placeSearchRequestRef.current === requestId) {
        setPlaceSearchLoading(false);
      }
    }
  }, [start]);

  const handleSelectDestination = useCallback((place) => {
    placeSearchRequestRef.current += 1;
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
      const recent = {
        id: `${Date.now()}-${routePointKey(start)}-${routePointKey(destination)}`,
        title: routeTitle(startLabel, destinationLabel),
        start,
        destination,
        startLabel: startLabel || 'Start',
        destinationLabel: destinationLabel || 'Destination',
        distanceKm: result.summary?.totalDistanceKm,
        chargingStopCount: result.summary?.chargingStopCount ?? result.chargingStops?.length ?? 0,
        createdAt: new Date().toISOString(),
      };
      setRecentRoutes((current) => {
        const next = [
          recent,
          ...current.filter(
            (route) =>
              routePointKey(route.start) !== routePointKey(start) ||
              routePointKey(route.destination) !== routePointKey(destination),
          ),
        ].slice(0, MAX_RECENT_ROUTES);
        saveRecentRoutes(next);
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    start,
    destination,
    selectedVehicle,
    battery,
    chargeThreshold,
    mapProvider,
    startLabel,
    destinationLabel,
  ]);

  const handleSelectRecentRoute = useCallback((route) => {
    if (!route?.start || !route?.destination) return;
    setStart(route.start);
    setDestination(route.destination);
    setStartLabel(route.startLabel || 'Recent start');
    setDestinationLabel(route.destinationLabel || 'Recent destination');
    setPlaceResults([]);
    setRouteResult(null);
    setPlacingMode(null);
    setError(null);
  }, []);

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
      <MapSidebar />
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
        recentRoutes={recentRoutes}
        onSelectRecentRoute={handleSelectRecentRoute}
        loading={loading}
        error={error}
      />
      <div className="app__main">
        <MapView
          center={DEFAULT_CENTER}
          start={start}
          destination={destination}
          chargingStops={routeResult?.chargingStops || []}
          stations={stations}
          routeGeometry={routeResult?.routeGeometry || null}
          placingMode={placingMode}
          mapProvider={mapProvider}
          onMapProviderError={() => {
            setMapProvider('osm');
            setError('Vietmap could not be loaded, switched back to OSM.');
          }}
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
