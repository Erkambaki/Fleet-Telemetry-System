import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/index";
import { clearStore } from "../src/store/vehicleStore";

describe("Telemetry API", () => {
  beforeEach(() => {
    clearStore();
  });

  // ── POST /telemetry ───────────────────────────────────────────────────────

  it("POST /telemetry accepts a valid batch and returns accepted count", async () => {
    const res = await request(app)
      .post("/telemetry")
      .send({
        events: [
          {
            vehicleId: "v-001",
            timestamp: "2024-01-01T10:00:00Z",
            lat: 51.5,
            lon: -0.1,
            speed: 60,
            fuelLevel: 80,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.accepted).toBe(1);
  });

  it("POST /telemetry rejects a batch larger than 100 events", async () => {
    const events = Array.from({ length: 101 }, (_, i) => ({
      vehicleId: `v-${i}`,
      timestamp: "2024-01-01T10:00:00Z",
      lat: 0,
      lon: 0,
      speed: 0,
      fuelLevel: 100,
    }));

    const res = await request(app).post("/telemetry").send({ events });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100/);
  });

  it("POST /telemetry rejects a missing events field", async () => {
    const res = await request(app).post("/telemetry").send({});
    expect(res.status).toBe(400);
  });

  it("POST /telemetry rejects malformed event objects", async () => {
    const res = await request(app)
      .post("/telemetry")
      .send({ events: [{ vehicleId: "v-001" }] }); // missing required fields
    expect(res.status).toBe(400);
  });

  // ── GET /vehicles/latest ─────────────────────────────────────────────────

  it("GET /vehicles/latest returns empty array when no data", async () => {
    const res = await request(app).get("/vehicles/latest");
    expect(res.status).toBe(200);
    expect(res.body.vehicles).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it("GET /vehicles/latest returns latest state after ingestion", async () => {
    await request(app)
      .post("/telemetry")
      .send({
        events: [
          {
            vehicleId: "v-001",
            timestamp: "2024-01-01T10:00:00Z",
            lat: 51.5,
            lon: -0.1,
            speed: 60,
            fuelLevel: 80,
          },
          {
            vehicleId: "v-002",
            timestamp: "2024-01-01T10:00:00Z",
            lat: 48.8,
            lon: 2.35,
            speed: 120,
            fuelLevel: 40,
          },
        ],
      });

    const res = await request(app).get("/vehicles/latest");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);

    const ids = res.body.vehicles.map((v: { vehicleId: string }) => v.vehicleId);
    expect(ids).toContain("v-001");
    expect(ids).toContain("v-002");
  });
});
