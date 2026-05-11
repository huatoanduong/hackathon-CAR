import './MapSidebar.css';

const sidebarItems = [
  { icon: '☰', label: 'Menu' },
  { icon: '⚡', label: 'EV route' },
  { icon: '↺', label: 'Recent' },
  { icon: '▣', label: 'Stations' },
  { icon: '…', label: 'More' },
];

export default function MapSidebar() {
  return (
    <nav className="map-sidebar" aria-label="Map tools">
      {sidebarItems.map((item, index) => (
        <button
          key={item.label}
          className={`map-sidebar__item ${index === 1 ? 'map-sidebar__item--active' : ''}`}
          type="button"
          title={item.label}
        >
          <span className="map-sidebar__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
