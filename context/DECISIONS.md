# DECISIONS.md — Architecture Decision Records (ADRs)
> Log of significant technical decisions made during development.
> **Never delete an ADR.** If a decision is reversed, add a new ADR that supersedes it.

---

## ADR Template

```
### ADR-NNN: Short Title
**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by ADR-NNN
**Context:** What situation forced this decision?
**Decision:** What did we choose?
**Consequences:** What becomes easier? What becomes harder?
```

---

## ADR-001: React as Frontend Framework
**Date:** 2026-05-01
**Status:** Accepted

**Context:** Hackathon project needing a rapid UI with interactive maps and dynamic state.

**Decision:** Use React 18 with functional components and hooks. No class components. No Redux — state lives in `App.jsx` and is passed down via props.

**Consequences:**
- (+) Fast to prototype, large ecosystem, team familiarity
- (+) Vite gives near-instant HMR in development
- (-) As state grows, prop drilling through App.jsx may become painful — watch for this signal and consider Context API if it happens

---

## ADR-002: Leaflet for Map Rendering
**Date:** 2026-05-01
**Status:** Accepted

**Context:** Need interactive map with custom markers and route polyline overlay.

**Decision:** Use `leaflet` + `react-leaflet` with OpenStreetMap tiles (free, no API key required).

**Consequences:**
- (+) No API key needed for tiles — works offline for hackathon demos
- (+) Full control over marker and polyline styling
- (-) Tile loading is slower than Google Maps; not suitable for production at scale
- (-) react-leaflet requires the map container to have an explicit height set in CSS or the map renders blank — this is a common gotcha

---

## ADR-003: Plain CSS (No CSS Framework)
**Date:** 2026-05-01
**Status:** Accepted

**Context:** Hackathon timeline doesn't allow learning a new CSS framework.

**Decision:** Co-located plain CSS files per component. Global CSS variables in `App.css` for color/spacing tokens.

**Consequences:**
- (+) Zero setup, no learning curve
- (-) No responsive utilities, no utility classes — write layout CSS manually
- Note: Tailwind or Pico.css would be good candidates if we revisit this

---

## ADR-004: Static Data Files in `data/`
**Date:** 2026-05-01
**Status:** Accepted

**Context:** EV station data needs to be available for route planning but there's no live data API.

**Decision:** Store EV station data as JSON/CSV in `data/`. A Python script in `scripts/` fetches fresh data from Google My Maps on demand. The backend loads this file at startup.

**Consequences:**
- (+) Simple — no database needed for hackathon
- (-) Data goes stale — no real-time availability info
- (-) Backend must reload or restart to pick up new data files

---

## ADR-005: Docker + Nginx for Frontend Production Build
**Date:** 2026-05-01
**Status:** Accepted

**Context:** Need a portable deployment artifact for the hackathon demo environment.

**Decision:** `web/Dockerfile` runs `npm run build` and serves the `dist/` folder with Nginx. Backend is a separate container.

**Consequences:**
- (+) One-command deploy: `docker compose up`
- (+) Static file serving is fast and simple
- (-) Any frontend change requires a full image rebuild

---

## ADR-006: No TypeScript
**Date:** 2026-05-01
**Status:** Accepted

**Context:** Hackathon speed > long-term type safety.

**Decision:** Stay with plain JavaScript (.jsx / .js). If the project continues post-hackathon, migrate incrementally starting with `services/api.js`.

**Consequences:**
- (+) Faster iteration, no type errors to fight during hacking
- (-) No compile-time safety; API shape mismatches are runtime errors only
- Migration path: add `jsconfig.json` for IntelliSense first, then convert one file at a time

---

*New decisions: copy the template above, assign the next ADR number, fill it in.*
