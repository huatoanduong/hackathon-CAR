import { useState } from 'react';
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
  loading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const canPlan = start && destination && selectedVehicle && !loading;
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onDestinationSearch(searchQuery);
  };

  return (
    <aside className="control-panel">
      <h1 className="control-panel__title">EV Route Planner</h1>

      {/* Location pickers */}
      <section className="control-panel__section">
        <h2 className="control-panel__heading">Locations</h2>

        <div className="control-panel__location">
          <label>Start</label>
          <div className="control-panel__location-body">
            <span className={start ? 'control-panel__coord' : 'control-panel__coord control-panel__coord--empty'}>
              {start ? `${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : 'Not set'}
            </span>
            {startLabel && <span className="control-panel__place-name">{startLabel}</span>}
          </div>
          <button className="control-panel__icon-btn" onClick={onUseCurrentLocation} title="Use current location">
            ◎
          </button>
          <button
            className={`control-panel__pin-btn ${placingMode === 'start' ? 'control-panel__pin-btn--active' : ''}`}
            onClick={() =>
              onPlacingModeChange(placingMode === 'start' ? null : 'start')
            }
          >
            {placingMode === 'start' ? 'Placing…' : 'Set on map'}
          </button>
        </div>

        <form className="control-panel__search" onSubmit={handleSearchSubmit}>
          <label htmlFor="destination-search">Destination</label>
          <div className="control-panel__search-box">
            <input
              id="destination-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search a place in Vietnam"
            />
            <button type="submit" disabled={placeSearchLoading || searchQuery.trim().length < 2}>
              {placeSearchLoading ? '...' : 'Search'}
            </button>
          </div>
          {placeResults.length > 0 && (
            <div className="control-panel__results">
              {placeResults.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="control-panel__result"
                  onClick={() => {
                    setSearchQuery(place.name);
                    onSelectDestination(place);
                  }}
                >
                  <strong>{place.name}</strong>
                  <span>{place.address}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="control-panel__location">
          <label>Target</label>
          <div className="control-panel__location-body">
            <span className={destination ? 'control-panel__coord' : 'control-panel__coord control-panel__coord--empty'}>
              {destination
                ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                : 'Not set'}
            </span>
            {destinationLabel && <span className="control-panel__place-name">{destinationLabel}</span>}
          </div>
          <button
            className={`control-panel__pin-btn ${placingMode === 'destination' ? 'control-panel__pin-btn--active' : ''}`}
            onClick={() =>
              onPlacingModeChange(
                placingMode === 'destination' ? null : 'destination',
              )
            }
          >
            {placingMode === 'destination' ? 'Placing…' : 'Set on map'}
          </button>
        </div>
      </section>

      {/* Vehicle selector */}
      <section className="control-panel__section">
        <h2 className="control-panel__heading">Vehicle</h2>
        <select
          className="control-panel__select"
          value={selectedVehicle}
          onChange={(e) => onVehicleChange(e.target.value)}
        >
          {vehicles.length === 0 && <option value="">Loading…</option>}
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.officialRangeKm} km)
            </option>
          ))}
        </select>
      </section>

      {/* Battery inputs */}
      <section className="control-panel__section">
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

      {/* Actions */}
      <section className="control-panel__section">
        <button
          className="control-panel__plan-btn"
          disabled={!canPlan}
          onClick={onPlanRoute}
        >
          {loading ? 'Planning…' : 'Plan Route'}
        </button>
        <button className="control-panel__reset-btn" onClick={onReset}>
          Reset
        </button>
      </section>

      {/* Error display */}
      {error && (
        <div className="control-panel__error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </aside>
  );
}
