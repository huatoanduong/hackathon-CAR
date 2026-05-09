# SYSTEM_OVERVIEW.md
> High-level architecture reference. Read after AGENT_GUIDELINES.md.

---

## What This System Does

**hackathon-CAR** is an EV (Electric Vehicle) route planner. A user opens the web app, selects their EV model, sets their current battery level and minimum charge threshold, then clicks two points on a map. The system calculates the optimal driving route and identifies which EV charging stations to stop at along the way.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (User)                    │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │  ControlPanel│   │   MapView    │   │RouteDetail│ │
│  │  (settings) │   │  (Leaflet)   │   │  Panel   │ │
│  └──────┬──────┘   └──────┬───────┘   └────┬─────┘ │
│         └─────────────────┼────────────────┘       │
│                           │ state via App.jsx        │
└───────────────────────────┼─────────────────────────┘
                            │ HTTP (api.js)
                            ▼
               ┌────────────────────────┐
               │     Backend API        │
               │  (not yet implemented) │
               └────────────┬───────────┘
                            │
               ┌────────────▼───────────┐
               │      data/ (static)    │
               │  EV station datasets   │
               │  (CSV / JSON / GeoJSON)│
               └────────────────────────┘
```

---

## Key Data Flows

### 1. Route Planning Flow
```
User sets origin + destination on map
        ↓
App.jsx collects: origin, destination, vehicle, battery%, threshold%
        ↓
api.js POST /route  →  Backend
        ↓
Backend queries EV station data, runs routing algorithm
        ↓
Returns: route polyline, list of charging stops, estimated range
        ↓
MapView renders polyline + stop markers
RouteDetailPanel renders stop list + times
```

### 2. EV Station Data Flow
```
scripts/fetch_ev_stations.py
        ↓  (Google My Maps scrape)
data/ev_stations.json  (raw)
        ↓  (preprocessing, if needed)
Backend loads at startup
```

---

## Component Responsibilities

| Component | File | Responsibility |
|-----------|------|---------------|
| App | `web/src/App.jsx` | Root layout, global state (vehicle, battery, route result), coordinates all child components |
| MapView | `web/src/components/MapView.jsx` | Renders Leaflet map, handles origin/destination pin placement, draws route polyline |
| ControlPanel | `web/src/components/ControlPanel.jsx` | Vehicle selector dropdown, battery level slider, charge threshold slider, "Plan Route" button |
| RouteDetailPanel | `web/src/components/RouteDetailPanel.jsx` | Displays planned route: distance, duration, charging stops with location and charge time |
| AgentStructureGuide | `web/src/components/AgentStructureGuide.jsx` | (Dev utility) Shows the agentic folder structure guide in-browser |
| RoutePlannerWorkspace | `web/src/components/RoutePlannerWorkspace.jsx` | Wrapper/workspace layout for the planner UI |
| API Service | `web/src/services/api.js` | All HTTP calls to backend — single source of truth for API shape |

---

## State Model (App.jsx)

```javascript
{
  vehicle: string,         // selected EV model ID
  batteryLevel: number,    // current battery 0–100 (%)
  chargeThreshold: number, // minimum battery before stopping 0–100 (%)
  origin: LatLng | null,   // map click origin
  destination: LatLng | null,
  routeResult: {
    polyline: LatLng[],
    stops: ChargingStop[],
    totalDistance: number,
    totalDuration: number
  } | null
}
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | React 18 | Functional components + hooks only |
| Build tool | Vite | Fast HMR dev server |
| Map rendering | Leaflet + React-Leaflet | Tile layer from OpenStreetMap |
| Styling | Plain CSS | Co-located with components, no CSS-in-JS |
| Containerization | Docker + Nginx | Production build served as static files |
| Backend | TBD / Python FastAPI | Not yet implemented |
| Data | JSON / CSV | EV station locations from Google Maps |

---

## Environment Setup Summary

```bash
cd web
npm install
npm run dev      # → http://localhost:5173
```

Full setup details: [docs/SETUP.md](docs/SETUP.md)

---

## Known Limitations (as of project start)

1. **Backend not implemented** — `web/src/services/api.js` calls endpoints that do not yet exist; the frontend may use mock/hardcoded data
2. **No authentication** — single-user, no accounts
3. **No automated tests** — all testing is manual in-browser
4. **EV station data is static** — no real-time availability

---

## Where Things Are NOT (to avoid confusion)

- There is no Redux or Zustand — state lives in `App.jsx`
- There is no TypeScript — all files are `.jsx` or `.js`
- There is no backend server folder in this repo yet — backend is a separate concern
- There is no `public/` folder with images — the Leaflet map tiles come from CDN

---

*Last updated: 2026-05-09*
