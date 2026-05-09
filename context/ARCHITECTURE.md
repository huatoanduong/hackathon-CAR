# ARCHITECTURE.md
> Component map, folder conventions, and structural rules for the codebase.

---

## Folder Structure Philosophy

Each folder has exactly one purpose. When an agent is unsure where to put something, the answer is always: find the folder whose purpose matches, and if none does, ask before creating a new one.

```
web/src/
├── components/    ← Visual UI pieces (React components)
├── services/      ← Data fetching and external communication
└── App.jsx        ← Root: layout skeleton + global state only
```

---

## Component Architecture

### Hierarchy

```
App.jsx  (global state, layout shell)
├── ControlPanel.jsx     (inputs: vehicle, battery, threshold, trigger)
├── MapView.jsx          (map display + origin/destination selection)
├── RouteDetailPanel.jsx (route results display)
└── [future components]
```

### Rules for Components

1. **One file = one component.** Do not put two exported components in the same file.
2. **Co-locate styles.** `Foo.jsx` always has `Foo.css` in the same directory.
3. **Props down, events up.** Components receive data via props, communicate to parent via callback props (e.g., `onRouteRequest`, `onOriginSet`).
4. **No direct API calls inside components.** All API calls go through `services/api.js`.
5. **No global state inside components.** Lift state to `App.jsx` when two components need the same data.

### When to Create a New Component

Create a new component when:
- A UI section is reused in more than one place
- A section has independent loading/error state
- A section's JSX exceeds ~80 lines

Do NOT create a component for:
- A simple HTML wrapper with no logic
- A one-line utility render

---

## Services Architecture

```
web/src/services/
└── api.js   ← all HTTP interactions with the backend
```

### api.js Conventions

```javascript
// Pattern: one exported async function per API operation
export async function getVehicles() { ... }
export async function planRoute(origin, destination, vehicle, battery, threshold) { ... }
```

- All functions are `async` and return parsed JSON
- All functions throw on non-2xx responses (let the caller handle errors)
- Base URL comes from `import.meta.env.VITE_API_BASE_URL` (Vite env var)

---

## Data Files (`data/`)

```
data/
├── ev_stations.json      ← EV charging station locations (GeoJSON or array)
└── vehicles.json         ← EV vehicle models with range/battery specs
```

- **Treat `data/` as read-only.** Agents must not modify these files.
- Data is consumed by the backend (not imported directly into React).
- If new data is needed, add a script in `scripts/` to fetch/generate it.

---

## Scripts (`scripts/`)

```
scripts/
└── fetch_ev_stations.py   ← Pulls EV station data from Google My Maps
```

Scripts are standalone utilities. They are not imported by the frontend or backend.

**Naming convention:** `verb_noun.py` — e.g., `fetch_stations.py`, `clean_data.py`, `export_geojson.py`

---

## Environment Variables

Frontend environment variables must be prefixed with `VITE_` to be accessible in React:

```
VITE_API_BASE_URL=http://localhost:8000
```

Place in `web/.env.local` (not committed). See `docs/SETUP.md` for full env var list.

---

## Import Order Convention (frontend)

```javascript
// 1. React / external libraries
import React, { useState } from 'react';
import { MapContainer } from 'react-leaflet';

// 2. Internal services
import { planRoute } from '../services/api';

// 3. Internal components
import ControlPanel from './ControlPanel';

// 4. Styles
import './MapView.css';
```

---

## CSS Conventions

- Each component has its own CSS file — no shared global stylesheet (except `App.css` for layout shell)
- Class names use kebab-case: `.control-panel`, `.route-stop-item`
- Do NOT use inline styles for layout — use CSS classes
- Colors/spacing: define as CSS custom properties in `App.css`:
  ```css
  :root {
    --color-primary: #2563eb;
    --spacing-md: 1rem;
  }
  ```

---

## Adding a New Feature — Checklist

```
[ ] Create component file: web/src/components/FeatureName.jsx
[ ] Create style file:     web/src/components/FeatureName.css
[ ] Add API function:      web/src/services/api.js (if backend call needed)
[ ] Wire into App.jsx:     add to state + pass props down
[ ] Update this file:      add component to hierarchy above
[ ] Update SYSTEM_OVERVIEW.md: add to component table
[ ] Add task to tasks/DONE.md when complete
```

---

*Last updated: 2026-05-09*
