# SETUP.md — Development Environment Setup

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Included with Node.js |
| Python | 3.10+ | https://python.org (for data scripts) |
| Docker | 24+ | https://docker.com (optional, for production build) |

---

## Quick Start (Frontend Only)

```bash
# Clone the repo
git clone https://github.com/your-org/hackathon-CAR
cd hackathon-CAR

# Install frontend dependencies
cd web
npm install

# Start development server
npm run dev
# → App available at http://localhost:5173
```

---

## Environment Variables

Create `web/.env.local` (this file is gitignored — never commit it):

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000

# Optional: Leaflet tile provider (defaults to OpenStreetMap)
# VITE_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

If `VITE_API_BASE_URL` is not set, the frontend defaults to `http://localhost:8000`.

---

## Available npm Scripts (run from `web/`)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at http://localhost:5173 |
| `npm run build` | Production build → `web/dist/` |
| `npm run preview` | Preview the production build locally |

---

## Data Scripts (Python)

To refresh EV station data:

```bash
cd scripts
python fetch_ev_stations.py
# → writes to data/ev-stations.raw.json
```

To refresh EV vehicle/car model data:

```bash
python fetch_ev_cars.py
# → writes to data/ev-cars.raw.json
```

Python dependencies (install with pip):
```bash
pip install requests beautifulsoup4
```

---

## Docker (Full Stack)

```bash
# Build frontend image
docker build -t hackathon-car-web web/

# Run frontend container (serves on port 80)
docker run -p 8080:80 hackathon-car-web
# → http://localhost:8080
```

Full docker-compose (once backend is implemented — see TASK-010 in BACKLOG.md):
```bash
docker compose up
```

---

## Common Setup Issues

### "Cannot find module" on npm run dev
```bash
cd web && npm install
```

### Map is blank
The Leaflet map container needs an explicit height in CSS. See `KNOWN_ISSUES.md` ISSUE-001.

### API calls fail with 404
Backend is not yet running. See `KNOWN_ISSUES.md` ISSUE-002. The frontend may display mock data in the meantime.

### Port 5173 already in use
```bash
# Kill the process using that port (macOS/Linux)
lsof -ti:5173 | xargs kill

# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or just use a different port
npm run dev -- --port 3000
```
