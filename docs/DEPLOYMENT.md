# DEPLOYMENT.md — Production Deployment Guide

---

## Overview

The frontend is a static site built by Vite and served by Nginx inside Docker. The backend (when implemented) runs as a separate container. Both should be orchestrated with `docker-compose`.

---

## Frontend Production Build

```bash
cd web

# Build static files
npm run build
# → output in web/dist/

# Preview locally before deploying
npm run preview
# → http://localhost:4173
```

---

## Docker Image Build

```bash
# From repo root
docker build -t hackathon-car-web web/

# Run (maps container port 80 to host port 8080)
docker run -d -p 8080:80 --name car-web hackathon-car-web

# Verify
curl http://localhost:8080
```

The `web/Dockerfile` does:
1. `npm run build` inside a Node build stage
2. Copies `dist/` to an Nginx Alpine image
3. Uses `web/nginx.conf` for SPA routing (all routes → `index.html`)

---

## Nginx Configuration Notes

`web/nginx.conf` is configured for a Single-Page Application:
- All requests that don't match a static file fall back to `index.html`
- This is required for React Router (if added later) to work correctly
- Gzip compression is enabled for JS/CSS assets

---

## Environment Variables in Production

Vite bakes env vars into the static bundle at build time. To set `VITE_API_BASE_URL` for production:

```bash
# Pass as build arg
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourapp.com \
  -t hackathon-car-web web/
```

Or set in `web/.env.production` before building (do not commit secrets to this file).

---

## Full Stack (docker-compose)

Once the backend is implemented, add a `docker-compose.yml` at the repo root:

```yaml
# docker-compose.yml (template — fill in when backend exists)
version: "3.9"
services:
  web:
    build: ./web
    ports:
      - "8080:80"
    environment:
      - VITE_API_BASE_URL=http://api:8000
    depends_on:
      - api

  api:
    build: ./backend        # folder doesn't exist yet — see TASK-001
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data    # mount station data
```

```bash
docker compose up --build
# → Web: http://localhost:8080
# → API: http://localhost:8000
```

---

## Deployment Checklist

```
[ ] npm run build succeeds with no errors
[ ] npm run preview shows the app working correctly
[ ] VITE_API_BASE_URL points to production backend (not localhost)
[ ] docker build succeeds
[ ] Container starts and serves index.html on expected port
[ ] Route planning works end-to-end in production build
[ ] No API keys or secrets in the built image
```

---

## Troubleshooting

### White screen after deploy
- Check browser console for JS errors
- Likely cause: `VITE_API_BASE_URL` not set, or wrong value in production build
- The Vite build embeds the env var at build time — rebuild the image with the correct value

### Nginx 404 on page refresh
- Ensure `nginx.conf` has the `try_files $uri /index.html` directive
- This is already set in `web/nginx.conf`

### Docker container exits immediately
```bash
docker logs car-web
```
- Nginx config syntax error is the most common cause
- Run `docker run --rm hackathon-car-web nginx -t` to test config
