import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const chargingIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ placingMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (placingMode) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function FitBounds({ start, destination, routePositions }) {
  const map = useMap();

  useEffect(() => {
    if (routePositions?.length > 1) {
      map.fitBounds(L.latLngBounds(routePositions), { padding: [50, 50] });
    } else if (start && destination) {
      map.fitBounds(L.latLngBounds([start, destination]), { padding: [50, 50] });
    } else if (start || destination) {
      map.setView(start || destination, 13);
    }
  }, [destination, map, routePositions, start]);

  return null;
}

function ChargingStopPopup({ stop, index }) {
  const powerLevels = stop.powerLevelsKw?.length
    ? stop.powerLevelsKw.map((level) => `${level}kW`).join(', ')
    : null;

  return (
    <div className="charging-popup">
      <div className="charging-popup__header">
        <span className="charging-popup__eyebrow">Stop {index + 1}</span>
        <strong className="charging-popup__title">
          {stop.name || `Charging Stop ${index + 1}`}
        </strong>
        {stop.status && <span className="charging-popup__status">{stop.status}</span>}
      </div>

      <div className="charging-popup__metrics">
        <div>
          <span>Before</span>
          <strong>{stop.batteryBeforeChargingPercent}%</strong>
        </div>
        <div>
          <span>After</span>
          <strong>{stop.batteryAfterChargingPercent}%</strong>
        </div>
        <div>
          <span>Max</span>
          <strong>{stop.maxPowerKw ? `${stop.maxPowerKw}kW` : 'N/A'}</strong>
        </div>
      </div>

      <div className="charging-popup__grid">
        {stop.connectorCount && (
          <>
            <span>Cổng sạc</span>
            <strong>{stop.connectorCount}</strong>
          </>
        )}
        {powerLevels && (
          <>
            <span>Công suất</span>
            <strong>{powerLevels}</strong>
          </>
        )}
        {stop.connectorSummary && (
          <>
            <span>Chi tiết</span>
            <strong>{stop.connectorSummary}</strong>
          </>
        )}
        {stop.accessInfo && (
          <>
            <span>Hoạt động</span>
            <strong>{stop.accessInfo}</strong>
          </>
        )}
      </div>

      {stop.address && <p className="charging-popup__address">{stop.address}</p>}

      {stop.selectionReason && (
        <p className="charging-popup__reason">{stop.selectionReason}</p>
      )}
    </div>
  );
}

export default function MapView({
  center,
  start,
  destination,
  chargingStops,
  routeGeometry,
  placingMode,
  onMapClick,
  onMarkerDrag,
}) {
  const routePositions = useMemo(() => {
    if (!routeGeometry) return null;

    if (routeGeometry.type === 'LineString' && routeGeometry.coordinates) {
      return routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }

    if (Array.isArray(routeGeometry)) {
      return routeGeometry;
    }

    if (routeGeometry.legs) {
      return routeGeometry.legs.flatMap((leg) => {
        if (leg.geometry?.type === 'LineString') {
          return leg.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
        return [];
      });
    }

    return null;
  }, [routeGeometry]);

  const cursorClass = placingMode ? 'map-container--placing' : '';

  return (
    <div className={`map-container ${cursorClass}`}>
      <MapContainer center={center} zoom={7} className="map" zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler placingMode={placingMode} onMapClick={onMapClick} />
        <FitBounds
          start={start}
          destination={destination}
          routePositions={routePositions}
        />

        {start && (
          <Marker
            position={start}
            icon={startIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onMarkerDrag('start', { lat, lng });
              },
            }}
          >
            <Popup>
              <strong>Start</strong>
              <br />
              {start.lat.toFixed(4)}, {start.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={destination}
            icon={destinationIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onMarkerDrag('destination', { lat, lng });
              },
            }}
          >
            <Popup>
              <strong>Destination</strong>
              <br />
              {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {chargingStops.map((stop, idx) => (
          <Marker
            key={stop.stationId || idx}
            position={[stop.lat, stop.lng]}
            icon={chargingIcon}
          >
            <Popup className="charging-popup-shell" maxWidth={320} minWidth={280}>
              <ChargingStopPopup stop={stop} index={idx} />
            </Popup>
          </Marker>
        ))}

        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
          />
        )}
      </MapContainer>

      {placingMode && (
        <div className="map-container__mode-hint">
          Click on the map to set your{' '}
          <strong>{placingMode === 'start' ? 'start' : 'destination'}</strong>{' '}
          location
        </div>
      )}
    </div>
  );
}
