# Backend

Fastify API and worker for the EV route planner.

## Commands

```bash
npm install
npm run build
npm test
npm run db:migrate
npm run db:seed
npm run dev
```

The API listens on `HOST` and `PORT`. The worker runs one station ingestion at startup and then follows `STATION_INGEST_CRON`.

## Endpoints

- `GET /health`
- `GET /api/vehicles`
- `GET /api/stations?lat=10.7769&lng=106.7009&radiusKm=5`
- `POST /api/routes/plan`

Station seed data is read from `data/ev-stations.raw.json` by default.
