import { useEffect, useRef, useState } from 'react';
import './ControlPanel.css';

export default function ControlPanel({
  vehicles,
  selectedVehicle,
  onVehicleChange,
  battery,
  onBatteryChange,
  chargeThreshold,
  onChargeThresholdChange,
  start,
  destination,
  startLabel,
  destinationLabel,
  placeResults,
  placeSearchLoading,
  placingMode,
  onPlacingModeChange,
  onDestinationSearch,
  onSelectDestination,
  onUseCurrentLocation,
  onPlanRoute,
  onReset,
  googleMapsUrl,
  recentRoutes = [],
  onSelectRecentRoute,
  showStations = false,
  onToggleStations,
  loading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const latestSearchRef = useRef(0);
  const skipNextSearchRef = useRef(false);
  const canPlan = start && destination && selectedVehicle && !loading;
  const selectedVehicleDetails = vehicles.find((v) => v.id === selectedVehicle);

  useEffect(() => {
    const query = searchQuery.trim();
    const searchId = latestSearchRef.current + 1;
    latestSearchRef.current = searchId;

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return undefined;
    }

    if (query.length < 2) return undefined;

    const timer = window.setTimeout(() => {
      if (latestSearchRef.current === searchId) {
        onDestinationSearch(query);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [onDestinationSearch, searchQuery]);

  const selectPlace = (place) => {
    skipNextSearchRef.current = true;
    setSearchQuery(place.name);
    onSelectDestination(place);
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) return;

    if (placeResults.length > 0) {
      selectPlace(placeResults[0]);
      return;
    }

    const results = await onDestinationSearch(query);
    if (results?.length > 0) {
      selectPlace(results[0]);
    }
  };

  const renderPlaceResults = (className = '') => {
    if (placeResults.length === 0) return null;

    return (
      <div className={`control-panel__results ${className}`.trim()}>
        {placeResults.map((place) => (
          <button
            key={place.id}
            type="button"
            className="control-panel__result"
            onClick={() => selectPlace(place)}
          >
            <strong>{place.name}</strong>
            <span>{place.address}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderLocation = ({
    type,
    label,
    point,
    placeLabel,
    showCurrentLocation = false,
  }) => {
    const genericLabels = new Set([
      'Current location',
      'Pinned on map',
      'Adjusted manually',
      'Recent start',
      'Recent destination',
    ]);
    const displayLabel = placeLabel && !genericLabels.has(placeLabel)
      ? placeLabel
      : '';
    const fallback = point
      ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
      : 'Not set';

    return (
      <div className={`control-panel__location control-panel__location--${type}`}>
        <label>{label}</label>
        <div className="control-panel__location-body">
          <span
            className={
              displayLabel || point
                ? 'control-panel__place-primary'
                : 'control-panel__place-primary control-panel__place-primary--empty'
            }
          >
            {displayLabel || fallback}
          </span>
        </div>
        <div className="control-panel__location-actions">
          {showCurrentLocation ? (
            <button
              className="control-panel__icon-btn"
              onClick={onUseCurrentLocation}
              title="Use current location"
              type="button"
            >
              ◎
            </button>
          ) : (
            <span className="control-panel__action-spacer" aria-hidden="true" />
          )}
          <button
            className={`control-panel__pin-btn ${
              placingMode === type ? 'control-panel__pin-btn--active' : ''
            }`}
            onClick={() => onPlacingModeChange(placingMode === type ? null : type)}
            type="button"
          >
            {placingMode === type ? 'Placing...' : 'Set on map'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="control-panel">
      <div className="control-panel__sheet-handle" aria-hidden="true" />
      <div className="control-panel__topbar">
        <h1 className="control-panel__title">T Map - EV Route Planner</h1>
        <span className="control-panel__status-pill">EV</span>
        <span className="control-panel__more-btn" aria-hidden="true">
          ...
        </span>
      </div>

      <form className="control-panel__hero-search" onSubmit={handleSearchSubmit}>
        <span className="control-panel__hero-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search destination"
        />
        <button type="submit" disabled={searchQuery.trim().length < 2}>
          {placeSearchLoading ? '...' : 'Go'}
        </button>
      </form>
      {renderPlaceResults('control-panel__results--hero')}

      <button
        type="button"
        className={`control-panel__station-toggle ${
          showStations ? 'control-panel__station-toggle--active' : ''
        }`}
        onClick={onToggleStations}
      >
        <span aria-hidden="true">EV</span>
        {showStations ? 'Hide charging stations' : 'Show charging stations'}
      </button>

      <section className="control-panel__section control-panel__section--locations">
        <h2 className="control-panel__heading">Locations</h2>

        {renderLocation({
          type: 'start',
          label: 'Start',
          point: start,
          placeLabel: startLabel,
          showCurrentLocation: true,
        })}

        <form className="control-panel__search" onSubmit={handleSearchSubmit}>
          <label htmlFor="destination-search">Destination</label>
          <div className="control-panel__search-box">
            <input
              id="destination-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search a place in Vietnam"
            />
            <button type="submit" disabled={searchQuery.trim().length < 2}>
              {placeSearchLoading ? '...' : 'Search'}
            </button>
          </div>
          {renderPlaceResults()}
        </form>

        {renderLocation({
          type: 'destination',
          label: 'Target',
          point: destination,
          placeLabel: destinationLabel,
        })}
      </section>

      {recentRoutes.length > 0 && (
        <section className="control-panel__section control-panel__section--recent">
          <div className="control-panel__section-title-row">
            <h2 className="control-panel__heading">Recent</h2>
            <span>{recentRoutes.length} saved</span>
          </div>
          <div className="control-panel__recent-list">
            {recentRoutes.map((route) => (
              <button
                key={route.id}
                type="button"
                className="control-panel__recent-route"
                onClick={() => onSelectRecentRoute?.(route)}
              >
                <span className="control-panel__recent-icon" aria-hidden="true">
                  Go
                </span>
                <span className="control-panel__recent-body">
                  <strong>{route.destinationLabel || route.title}</strong>
                  <span>
                    {route.startLabel || 'Start'} /{' '}
                    {Number.isFinite(route.distanceKm)
                      ? `${Math.round(route.distanceKm)} km`
                      : 'Recent route'} / {route.chargingStopCount || 0} stops
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="control-panel__section control-panel__section--advanced">
        <h2 className="control-panel__heading">Vehicle</h2>
        <select
          className="control-panel__select"
          value={selectedVehicle}
          onChange={(e) => onVehicleChange(e.target.value)}
        >
          {vehicles.length === 0 && <option value="">Loading...</option>}
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.officialRangeKm} km)
            </option>
          ))}
        </select>
      </section>

      <section className="control-panel__section control-panel__section--advanced">
        <h2 className="control-panel__heading">Battery</h2>

        <label className="control-panel__label">
          Current Battery: <strong>{battery}%</strong>
        </label>
        <input
          type="range"
          className="control-panel__range"
          min={1}
          max={100}
          value={battery}
          onChange={(e) => onBatteryChange(Number(e.target.value))}
        />

        <label className="control-panel__label">
          Charge Threshold: <strong>{chargeThreshold}%</strong>
        </label>
        <input
          type="range"
          className="control-panel__range"
          min={10}
          max={50}
          value={chargeThreshold}
          onChange={(e) => onChargeThresholdChange(Number(e.target.value))}
        />
      </section>

      <section className="control-panel__section">
        {selectedVehicleDetails && (
          <div className="control-panel__compact-meta">
            <span>{selectedVehicleDetails.name}</span>
            <strong>{battery}% battery</strong>
          </div>
        )}
        <button
          className="control-panel__plan-btn"
          disabled={!canPlan}
          onClick={onPlanRoute}
        >
          {loading ? 'Planning...' : 'Plan Route'}
        </button>
        {googleMapsUrl && (
          <a
            className="control-panel__google-btn"
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        )}
        <button className="control-panel__reset-btn" onClick={onReset}>
          Reset
        </button>
      </section>

      {error && (
        <div className="control-panel__error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </aside>
  );
}
