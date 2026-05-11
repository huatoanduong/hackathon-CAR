import './RouteDetailPanel.css';

export default function RouteDetailPanel({ legs, chargingStops, googleMapsUrl }) {
  if (!legs || legs.length === 0) return null;

  return (
    <div className="route-detail">
      <div className="route-detail__header">
        <h2 className="route-detail__title">Route Details</h2>
        {googleMapsUrl && (
          <a
            className="route-detail__google-btn"
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        )}
      </div>

      <div className="route-detail__legs">
        {legs.map((leg, idx) => {
          const stop = chargingStops?.find((s) => s.name === leg.to);
          const isChargingLeg = !!stop;

          return (
            <div key={idx} className="route-detail__leg">
              <div className="route-detail__leg-header">
                <span className="route-detail__leg-number">
                  Leg {idx + 1}
                </span>
                <span className="route-detail__leg-distance">
                  {leg.distanceKm?.toFixed(1)} km
                </span>
              </div>

              <div className="route-detail__leg-endpoints">
                <div className="route-detail__point">
                  <span className="route-detail__dot route-detail__dot--from" />
                  {leg.from}
                </div>
                <div className="route-detail__connector" />
                <div className="route-detail__point">
                  <span className="route-detail__dot route-detail__dot--to" />
                  {leg.to}
                </div>
              </div>

              <div className="route-detail__battery-row">
                <span>Arrival battery:</span>
                <span
                  className={`route-detail__battery-value ${
                    leg.estimatedArrivalBatteryPercent <= 20
                      ? 'route-detail__battery-value--low'
                      : ''
                  }`}
                >
                  {leg.estimatedArrivalBatteryPercent}%
                </span>
              </div>

              {isChargingLeg && (
                <div className="route-detail__charging-info">
                  <span>
                    Charge: {stop.batteryBeforeChargingPercent}% &rarr;{' '}
                    {stop.batteryAfterChargingPercent}%
                  </span>
                  {stop.selectionReason && (
                    <p className="route-detail__reason">
                      {stop.selectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
