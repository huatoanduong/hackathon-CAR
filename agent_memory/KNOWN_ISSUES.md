# KNOWN_ISSUES.md
> Active bugs, gotchas, and workarounds. Agents: check this before debugging anything.
> When an issue is fixed, mark it **[RESOLVED]** with the date — do not delete it.

---

## Format

```
### ISSUE-NNN: Short Title
**Status:** Active | Investigating | Resolved (YYYY-MM-DD)
**Affects:** Which files/components are affected
**Symptom:** What goes wrong — exactly what the user or developer sees
**Root Cause:** What we know about why it happens
**Workaround:** How to avoid/work around it now
**Fix:** What the real fix is (or "Unknown")
```

---

## Active Issues

### ISSUE-001: Leaflet Map Renders Blank (Missing Height)
**Status:** Active
**Affects:** `web/src/components/MapView.jsx`, `MapView.css`

**Symptom:** The map area is blank/white even though Leaflet initializes without error.

**Root Cause:** React-Leaflet's `MapContainer` requires its containing element to have an explicit height in CSS. If the parent has `height: auto` or no height set, the map renders to 0px height.

**Workaround:** Ensure `MapView.css` sets an explicit height:
```css
.map-container {
  height: 500px;   /* or 100vh, or calc(100vh - 60px), etc. */
  width: 100%;
}
```

**Fix:** Already documented in ARCHITECTURE.md ADR-002 — ensure height is always set explicitly.

---

### ISSUE-002: Backend API Calls Fail (404 / CORS)
**Status:** Active
**Affects:** `web/src/services/api.js`, all components that trigger API calls

**Symptom:** All API calls return 404 or CORS errors because the backend server is not running.

**Root Cause:** Backend is not yet implemented (see TASK-001 in BACKLOG.md).

**Workaround:** The frontend may use mock/hardcoded data in the meantime. Check `api.js` for any `// TODO: replace with real API` comments.

**Fix:** Complete TASK-001 (backend implementation).

---

### ISSUE-003: npm install Required Before First Run
**Status:** Active (known setup friction, not a bug)
**Affects:** New developers / agents running the project for the first time

**Symptom:** `npm run dev` fails with `Cannot find module` errors.

**Root Cause:** `node_modules/` is gitignored. `web/package-lock.json` is untracked.

**Workaround:**
```bash
cd web
npm install
npm run dev
```

**Fix:** Add `web/package-lock.json` to git (commit it). This allows `npm ci` for reproducible installs.

---

## Resolved Issues

*(No resolved issues yet — add them here with [RESOLVED] status when fixed)*

---

## How to Add a New Issue

1. Assign the next ISSUE-NNN number
2. Fill in all fields — leave "Root Cause" as "Unknown" if not yet determined
3. If you fix an issue, update status to `Resolved (YYYY-MM-DD)` and briefly note the fix
