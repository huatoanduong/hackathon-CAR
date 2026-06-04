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
  placingMode,
  onPlacingModeChange,
  onPlanRoute,
  onReset,
  loading,
  error,
}) {
  const canPlan = start && destination && selectedVehicle && !loading;

  return (
    <aside className="control-panel">
      <h1 className="control-panel__title">EV Route Planner</h1>

      {/* Location pickers */}
      <section className="control-panel__section">
        <h2 className="control-panel__heading">Locations</h2>

        <div className="control-panel__location">
          <label>Start</label>
          {start ? (
            <span className="control-panel__coord">
              {start.lat.toFixed(4)}, {start.lng.toFixed(4)}
            </span>
          ) : (
            <span className="control-panel__coord control-panel__coord--empty">
              Not set
            </span>
          )}
          <button
            className={`control-panel__pin-btn ${placingMode === 'start' ? 'control-panel__pin-btn--active' : ''}`}
            onClick={() =>
              onPlacingModeChange(placingMode === 'start' ? null : 'start')
            }
          >
            {placingMode === 'start' ? 'Placing…' : 'Set on map'}
          </button>
        </div>

        <div className="control-panel__location">
          <label>Destination</label>
          {destination ? (
            <span className="control-panel__coord">
              {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </span>
          ) : (
            <span className="control-panel__coord control-panel__coord--empty">
              Not set
            </span>
          )}
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
