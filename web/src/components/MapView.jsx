import { useEffect, useMemo, useRef, useState } from 'react';
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

const VIETMAP_TILE_API_KEY =
  import.meta.env.VITE_VIETMAP_TILE_API_KEY ||
  import.meta.env.VITE_VIETMAP_API_KEY;
const VIETMAP_CSS_URL =
  'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css';
const VIETMAP_SCRIPT_URL =
  'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js';
const MARKER_SHADOW_URL =
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const MARKER_ICON_URLS = {
  start:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  destination:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  charging:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: MARKER_SHADOW_URL,
});

const startIcon = new L.Icon({
  iconUrl: MARKER_ICON_URLS.start,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: MARKER_ICON_URLS.destination,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const chargingIcon = new L.Icon({
  iconUrl: MARKER_ICON_URLS.charging,
  shadowUrl: MARKER_SHADOW_URL,
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

function ResizeObserverBridge() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

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

function pointToLngLat(point) {
  return [point.lng, point.lat];
}

function routeToCoordinates(routeGeometry) {
  if (!routeGeometry) return null;

  if (routeGeometry.type === 'LineString' && routeGeometry.coordinates) {
    return routeGeometry.coordinates;
  }

  if (Array.isArray(routeGeometry)) {
    return routeGeometry.map(([lat, lng]) => [lng, lat]);
  }

  if (routeGeometry.legs) {
    return routeGeometry.legs.flatMap((leg) => {
      if (leg.geometry?.type === 'LineString') {
        return leg.geometry.coordinates;
      }
      return [];
    });
  }

  return null;
}

function loadVietmapGl() {
  if (window.vietmapgl) return Promise.resolve(window.vietmapgl);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${VIETMAP_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = VIETMAP_CSS_URL;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${VIETMAP_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.vietmapgl), {
        once: true,
      });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = VIETMAP_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.vietmapgl);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildChargingPopupHtml(stop, index) {
  const powerLevels = stop.powerLevelsKw?.length
    ? stop.powerLevelsKw.map((level) => `${level}kW`).join(', ')
    : null;

  const rows = [
    ['Cong sac', stop.connectorCount],
    ['Cong suat', powerLevels],
    ['Chi tiet', stop.connectorSummary],
    ['Hoat dong', stop.accessInfo],
  ].filter(([, value]) => value);

  return `
    <div class="charging-popup charging-popup--html">
      <div class="charging-popup__header">
        <span class="charging-popup__eyebrow">Stop ${index + 1}</span>
        <strong class="charging-popup__title">${escapeHtml(
          stop.name || `Charging Stop ${index + 1}`,
        )}</strong>
        ${stop.status ? `<span class="charging-popup__status">${escapeHtml(stop.status)}</span>` : ''}
      </div>
      <div class="charging-popup__metrics">
        <div><span>Before</span><strong>${escapeHtml(stop.batteryBeforeChargingPercent)}%</strong></div>
        <div><span>After</span><strong>${escapeHtml(stop.batteryAfterChargingPercent)}%</strong></div>
        <div><span>Max</span><strong>${stop.maxPowerKw ? `${escapeHtml(stop.maxPowerKw)}kW` : 'N/A'}</strong></div>
      </div>
      ${
        rows.length
          ? `<div class="charging-popup__grid">${rows
              .map(
                ([label, value]) =>
                  `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`,
              )
              .join('')}</div>`
          : ''
      }
      ${stop.address ? `<p class="charging-popup__address">${escapeHtml(stop.address)}</p>` : ''}
      ${
        stop.selectionReason
          ? `<p class="charging-popup__reason">${escapeHtml(stop.selectionReason)}</p>`
          : ''
      }
    </div>
  `;
}

function createMarkerElement(type) {
  const wrapper = document.createElement('div');
  wrapper.className = 'vietmap-marker';

  const shadow = document.createElement('img');
  shadow.className = 'vietmap-marker__shadow';
  shadow.src = MARKER_SHADOW_URL;
  shadow.alt = '';
  shadow.draggable = false;

  const icon = document.createElement('img');
  icon.className = 'vietmap-marker__icon';
  icon.src = MARKER_ICON_URLS[type];
  icon.alt = '';
  icon.draggable = false;

  wrapper.append(shadow, icon);
  return wrapper;
}

function VietmapView({
  center,
  start,
  destination,
  chargingStops,
  routeGeometry,
  placingMode,
  onMapClick,
  onMarkerDrag,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clickHandlerRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const routeCoordinates = useMemo(
    () => routeToCoordinates(routeGeometry),
    [routeGeometry],
  );

  useEffect(() => {
    let cancelled = false;

    loadVietmapGl()
      .then((vietmapgl) => {
        if (cancelled || mapRef.current) return;
        const map = new vietmapgl.Map({
          container: containerRef.current,
          style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_TILE_API_KEY}`,
          center: [center[1], center[0]],
          zoom: 7,
        });
        map.addControl(new vietmapgl.NavigationControl(), 'top-right');
        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load Vietmap GL');
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    if (placingMode) {
      const handler = (event) => {
        onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      };
      clickHandlerRef.current = handler;
      map.on('click', handler);
    }

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
    };
  }, [onMapClick, placingMode]);

  useEffect(() => {
    const map = mapRef.current;
    const vietmapgl = window.vietmapgl;
    if (!map || !vietmapgl) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const addMarker = ({ point, type, popupHtml, draggable, onDragEnd }) => {
      if (!point) return;
      const marker = new vietmapgl.Marker({
        element: createMarkerElement(type),
        anchor: 'bottom',
        draggable,
      })
        .setLngLat(pointToLngLat(point))
        .addTo(map);

      if (popupHtml) {
        marker.setPopup(new vietmapgl.Popup({ offset: 24 }).setHTML(popupHtml));
      }

      if (onDragEnd) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onDragEnd({ lat: lngLat.lat, lng: lngLat.lng });
        });
      }

      markersRef.current.push(marker);
    };

    addMarker({
      point: start,
      type: 'start',
      popupHtml: start
        ? `<strong>Start</strong><br />${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}`
        : null,
      draggable: true,
      onDragEnd: (latlng) => onMarkerDrag('start', latlng),
    });
    addMarker({
      point: destination,
      type: 'destination',
      popupHtml: destination
        ? `<strong>Destination</strong><br />${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
        : null,
      draggable: true,
      onDragEnd: (latlng) => onMarkerDrag('destination', latlng),
    });

    chargingStops.forEach((stop, idx) => {
      addMarker({
        point: stop,
        type: 'charging',
        popupHtml: buildChargingPopupHtml(stop, idx),
      });
    });
  }, [chargingStops, destination, onMarkerDrag, start]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const routeData = routeCoordinates?.length > 1
      ? {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        }
      : {
          type: 'FeatureCollection',
          features: [],
        };

    const updateRoute = () => {
      if (map.getSource('planned-route')) {
        map.getSource('planned-route').setData(routeData);
        return;
      }

      map.addSource('planned-route', {
        type: 'geojson',
        data: routeData,
      });
      map.addLayer({
        id: 'planned-route-line',
        type: 'line',
        source: 'planned-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.82,
        },
      });
    };

    if (map.isStyleLoaded()) {
      updateRoute();
    } else {
      map.once('load', updateRoute);
    }
  }, [routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    const vietmapgl = window.vietmapgl;
    if (!map || !vietmapgl) return;

    const coordinates = routeCoordinates?.length
      ? routeCoordinates
      : [start, destination].filter(Boolean).map(pointToLngLat);

    if (coordinates.length > 1) {
      const bounds = coordinates.reduce(
        (acc, coord) => acc.extend(coord),
        new vietmapgl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      map.fitBounds(bounds, { padding: 56, maxZoom: 14 });
    } else if (coordinates.length === 1) {
      map.flyTo({ center: coordinates[0], zoom: 13 });
    }
  }, [destination, routeCoordinates, start]);

  return (
    <>
      <div ref={containerRef} className="map map--vietmap" />
      {loadError && <div className="map-container__provider-error">{loadError}</div>}
    </>
  );
}

function LeafletMapView({
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
    const coordinates = routeToCoordinates(routeGeometry);
    return coordinates?.map(([lng, lat]) => [lat, lng]) || null;
  }, [routeGeometry]);

  return (
    <MapContainer center={center} zoom={7} className="map" zoomControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler placingMode={placingMode} onMapClick={onMapClick} />
      <ResizeObserverBridge />
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
  );
}

export default function MapView({
  center,
  start,
  destination,
  chargingStops,
  routeGeometry,
  placingMode,
  mapProvider,
  onMapProviderChange,
  onMapClick,
  onMarkerDrag,
}) {
  const cursorClass = placingMode ? 'map-container--placing' : '';
  const sharedProps = {
    center,
    start,
    destination,
    chargingStops,
    routeGeometry,
    placingMode,
    onMapClick,
    onMarkerDrag,
  };

  return (
    <div className={`map-container map-container--${mapProvider} ${cursorClass}`}>
      <div className="map-provider-toggle" aria-label="Map provider">
        <button
          type="button"
          className={mapProvider === 'osm' ? 'is-active' : ''}
          onClick={() => onMapProviderChange('osm')}
        >
          OSM
        </button>
        <button
          type="button"
          className={mapProvider === 'vietmap' ? 'is-active' : ''}
          disabled={!VIETMAP_TILE_API_KEY}
          title={
            VIETMAP_TILE_API_KEY
              ? 'Use Vietmap'
              : 'Set VITE_VIETMAP_TILE_API_KEY to test Vietmap'
          }
          onClick={() => onMapProviderChange('vietmap')}
        >
          Vietmap
        </button>
      </div>

      {mapProvider === 'vietmap' && VIETMAP_TILE_API_KEY ? (
        <VietmapView {...sharedProps} />
      ) : (
        <LeafletMapView {...sharedProps} />
      )}

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
