# CURRENT_TASK.md
> The ONE task being actively worked on. Update this every session.
> Agents: read this before writing a single line of code.

---

## Handoff Note
*(Written by the agent at the end of each session — this is the first thing the next agent reads)*

**2026-05-09:** Initial agentic project structure scaffolded. The web frontend (React + Leaflet) has UI components in place but the backend API is not yet implemented. The frontend likely uses mock data or placeholder calls. The next priority is confirming what mock data exists and beginning backend implementation.

---

## Active Task

**Task ID:** TASK-001
**Title:** Implement Backend Route Planning API
**Started:** 2026-05-09
**Assigned to:** TBD
**Priority:** High

### Goal
Build the backend API server that the frontend (`web/src/services/api.js`) calls to plan EV routes with charging stops.

### Acceptance Criteria
- [ ] `GET /vehicles` returns list of supported EV models from a data file
- [ ] `POST /route` accepts origin, destination, vehicle, battery params and returns a route with charging stops
- [ ] `GET /stations` returns all EV station locations for map display
- [ ] Frontend can successfully call all three endpoints and display results

### Current State
- Frontend UI components exist and are wired together
- `api.js` has placeholder/mock calls
- No backend server exists yet
- EV station data is in `data/` folder

### Blockers
- None known

### Next Steps
1. Decide backend framework (FastAPI recommended — see context/DECISIONS.md ADR pattern)
2. Create `/api` or `/backend` folder at repo root
3. Implement `GET /vehicles` first (simplest)
4. Implement routing algorithm or integrate with Google Maps Directions API
5. Implement `POST /route` using station data from `data/`

### Notes
- API contracts are defined in `context/API_REFERENCE.md` — implement to those shapes
- Do NOT change the frontend API client shapes without also updating `context/API_REFERENCE.md`

---

## How to Update This File

At the start of a session:
- Read the Handoff Note to understand where things stand
- Confirm the Active Task is still the right thing to work on

During a session:
- Check off acceptance criteria as you complete them
- Add new blockers if discovered

At the end of a session:
- Update the Handoff Note with a 2-3 sentence summary
- Move completed tasks to `tasks/DONE.md`
- Update `Current State` with what changed
- Move the next task from `tasks/BACKLOG.md` to this file if this task is done
