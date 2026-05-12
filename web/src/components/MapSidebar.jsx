import './MapSidebar.css';

const sidebarItems = [
  { id: 'menu', icon: '☰', label: 'Menu' },
  { id: 'route', icon: 'EV', label: 'EV route' },
  { id: 'recent', icon: '↺', label: 'Recent' },
  { id: 'stations', icon: '⚡', label: 'Stations' },
  { id: 'more', icon: '…', label: 'More' },
];

export default function MapSidebar({ showStations, onToggleStations }) {
  return (
    <nav className="map-sidebar" aria-label="Map tools">
      {sidebarItems.map((item) => {
        const isStations = item.id === 'stations';
        const isActive = item.id === 'route' || (isStations && showStations);

        return (
          <button
            key={item.id}
            className={`map-sidebar__item ${isActive ? 'map-sidebar__item--active' : ''} ${
              isStations && showStations ? 'map-sidebar__item--stations-on' : ''
            }`.trim()}
            type="button"
            title={item.label}
            onClick={isStations ? onToggleStations : undefined}
            aria-pressed={isStations ? showStations : undefined}
          >
            <span className="map-sidebar__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
