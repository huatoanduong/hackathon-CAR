# BACKLOG.md
> Prioritized list of future work. Agents: do not work on these without explicit instruction.
> When starting a new task, move it from here to CURRENT_TASK.md.

---

## Priority Scale
- **P0** — Blocking: nothing else ships without this
- **P1** — High: needed before demo/launch
- **P2** — Medium: improves quality significantly
- **P3** — Low: nice to have, do later

---

## Backlog

### P0 — Blocking

| ID | Title | Notes |
|----|-------|-------|
| TASK-001 | Implement Backend Route Planning API | See CURRENT_TASK.md — in progress |

---

### P1 — High Priority

| ID | Title | Notes |
|----|-------|-------|
| TASK-002 | Wire up frontend to real backend (remove mocks) | After TASK-001 completes |
| TASK-003 | Add loading states to MapView and RouteDetailPanel | UX: show spinner while route is calculating |
| TASK-004 | Handle route infeasibility gracefully | Show user-friendly error when no charging route is possible |
| TASK-005 | Mobile responsive layout | Map + panel must work on phone screen |

---

### P2 — Medium Priority

| ID | Title | Notes |
|----|-------|-------|
| TASK-006 | Add real-time EV station availability | Requires external API integration |
| TASK-007 | Save and restore route history | localStorage is fine for hackathon |
| TASK-008 | Add turn-by-turn directions panel | Expand RouteDetailPanel with step-by-step |
| TASK-009 | Multi-stop route support | Allow more than one destination waypoint |
| TASK-010 | Dockerize backend and add docker-compose.yml | Full stack one-command start |

---

### P3 — Low Priority / Nice to Have

| ID | Title | Notes |
|----|-------|-------|
| TASK-011 | Dark mode | CSS custom properties make this straightforward |
| TASK-012 | Offline mode with cached station data | Service worker |
| TASK-013 | Export route to PDF / share link | Share route with others |
| TASK-014 | Add automated test suite (Vitest + React Testing Library) | Technical debt |
| TASK-015 | TypeScript migration | Start with services/api.js |

---

## How to Use This File

**Adding a task:** Append to the appropriate priority section.
**Starting a task:** Move the row to `CURRENT_TASK.md`, set status and date.
**Completing a task:** Move from `CURRENT_TASK.md` to `DONE.md`.
**Deprioritizing:** Move the row down to a lower priority section with a note.
