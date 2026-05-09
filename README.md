# hackathon-CAR — EV Route Planner

An interactive web application for planning electric vehicle routes with optimal charging stops.

**Tech stack:** React 18 · Vite · Leaflet · Docker/Nginx · Python (data scripts)

---

## AI Agent? Start Here

If you are an AI coding agent, read these files in this order before touching any code:

```
1. AGENT_GUIDELINES.md       ← conventions, workflow, navigation map
2. SYSTEM_OVERVIEW.md        ← architecture, data flows, component responsibilities
3. context/ARCHITECTURE.md   ← component structure and file conventions
4. tasks/CURRENT_TASK.md     ← what is being worked on RIGHT NOW
5. agent_memory/KNOWN_ISSUES.md ← active bugs and gotchas
```

---

## Quick Start (Human Developer)

```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

Full setup: [docs/SETUP.md](docs/SETUP.md) | Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Project Structure

```
hackathon-CAR/
├── AGENT_GUIDELINES.md      ← AI agent onboarding + conventions
├── SYSTEM_OVERVIEW.md       ← architecture overview
│
├── context/                 ← static project knowledge
│   ├── ARCHITECTURE.md      ← component map and file conventions
│   ├── API_REFERENCE.md     ← all API endpoint contracts
│   └── DECISIONS.md         ← architecture decision records (ADRs)
│
├── tasks/                   ← task tracking
│   ├── CURRENT_TASK.md      ← active work
│   ├── BACKLOG.md           ← prioritized future work
│   └── DONE.md              ← completed tasks log
│
├── agent_memory/            ← persistent cross-session agent state
│   ├── KNOWN_ISSUES.md      ← active bugs and workarounds
│   └── PROGRESS.md          ← build progress tracker
│
├── prompts/                 ← reusable prompt templates
│   ├── feature_request.md
│   ├── bug_report.md
│   └── code_review.md
│
├── docs/                    ← operational documentation
│   ├── SETUP.md             ← dev environment setup
│   └── DEPLOYMENT.md        ← production deployment guide
│
├── web/                     ← React frontend application
│   ├── src/
│   │   ├── components/      ← MapView, ControlPanel, RouteDetailPanel
│   │   ├── services/        ← api.js (HTTP client)
│   │   └── App.jsx          ← root component + global state
│   ├── Dockerfile
│   └── vite.config.js
│
├── data/                    ← EV station datasets (read-only)
├── scripts/                 ← data fetching and utility scripts
└── plan/                    ← planning artifacts and diagrams
```

---

## EV Station Dataset

Fetch EV charging station data from Google My Maps:

```bash
python scripts/fetch_ev_stations.py
# → data/ev-stations.raw.json
```

Source map KML:
```
https://www.google.com/maps/d/kml?mid=1h-GUae7-bU6YfRmNcxkNnKHJBwZnXWE&forcekml=1
```
