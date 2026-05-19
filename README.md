# Fleet Telemetry System

A small full-stack application that ingests vehicle telemetry events and displays the latest known state of each vehicle on a live dashboard.

---

## How to run

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
npm run dev
# API running at http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

### 3. Seed data

Once both are running, click **"Seed 500 Vehicles"** in the dashboard header to generate and post 500 simulated vehicles in batches of 100. The table will populate immediately.

### Running tests

```bash
cd backend
npm test
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/telemetry` | Accept a batch of up to 100 telemetry events |
| `GET` | `/vehicles/latest` | Return the most recent state per vehicle |
| `GET` | `/health` | Health check |

**POST /telemetry body:**
```json
{
  "events": [
    {
      "vehicleId": "VEH-0001",
      "timestamp": "2024-01-01T10:00:00Z",
      "lat": 48.8566,
      "lon": 2.3522,
      "speed": 72,
      "fuelLevel": 65
    }
  ]
}
```

---

## Design decisions

### Storage — in-memory `Map`
A `Map<vehicleId, VehicleState>` is the simplest correct structure for "latest state per vehicle": O(1) reads and writes, no setup overhead, and trivially explainable.

**Trade-off:** data is lost on restart, and historical events aren't retained. In production I'd write events to a time-series table (e.g. TimescaleDB or ClickHouse) and maintain a separate materialised "latest" view, updated via triggers or a stream processor.

### Backend — Express + TypeScript
Express is minimal and gives us full control. TypeScript catches shape mismatches between the API contract and the store early. For a small prototype this beats a heavier framework.

### Real-time strategy — polling (5 s interval)
Polling is simpler to reason about and sufficient for a prototype. The trade-off versus WebSockets:
- **Polling:** easy to implement, scales horizontally without sticky sessions, but wastes bandwidth when nothing changes.
- **WebSockets / SSE:** lower latency, efficient, but adds connection-state complexity. I'd reach for SSE in production — it's unidirectional (server → client), which is exactly what a dashboard needs.

### Frontend — Vue 3 + Vuetify 3
Followed the brief's recommendation. Vuetify's `v-data-table` handles sorting, pagination, and filtering out-of-the-box for 500 rows, which keeps the component code focused on domain logic rather than table mechanics.

### Validation
Batch limit (100) and field type checks are enforced in the route handler. I chose not to use a schema validation library (e.g. Zod) to keep dependencies minimal, but I'd add it for a production API.

---

## Tests

- **Unit test** (`tests/vehicleStore.test.ts`): covers store logic — insert, upsert-newer, reject-older, multiple vehicles.
- **Integration/API test** (`tests/telemetry.api.test.ts`): exercises both endpoints end-to-end via Supertest — happy paths and error cases (batch too large, missing fields, empty store).

---

## What I'd improve with more time

1. **Persistent storage** — SQLite with a `telemetry_events` table and a `vehicle_latest` view; trivial to swap in because the store module is the only place that touches data.
2. **Real-time updates via SSE** — replace the 5 s poll with a `/vehicles/stream` SSE endpoint; the frontend subscribes once and receives push updates.
3. **Map view** — render vehicle positions on a Leaflet/MapLibre map alongside the table.
4. **Input validation with Zod** — provide structured error messages per field.
5. **Docker Compose** — single `docker compose up` to run everything.
6. **More test coverage** — boundary conditions (exactly 100 events), concurrent writes, timestamp tie-breaking.

---

## AI tool usage

This project was developed with **Claude** as a coding assistant.

### Where I used it
- Generating the initial project scaffold (file structure, `package.json`, tsconfig).
- Drafting the `vehicleStore` module and its unit tests.
- Writing the Supertest integration tests.
- VehicleTable styling (Vuetify slot templates and CSS variables).

### What I accepted vs. rejected
- **Accepted:** the `Map`-based store structure and the timestamp-comparison upsert logic — both matched my own design intent.
- **Rejected / modified:** the initial App.vue used a global `setInterval` for the countdown display inside the child component, which caused a subtle double-timer bug when the parent also polled. I moved countdown responsibility fully into `VehicleTable` and had the parent own the actual data fetch.
- **Verified manually:** all validation logic in the route handler; test assertions; the polling interval teardown in `onUnmounted`.

### Where it helped / misled
- Helped most with boilerplate (tsconfig, Vitest config, Vite proxy setup).
- Initially suggested `localStorage` for persisting filter state — not applicable here since there's no auth/session concept and it added unnecessary complexity for a prototype.
