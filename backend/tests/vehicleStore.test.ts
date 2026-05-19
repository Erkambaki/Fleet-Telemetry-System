import { describe, it, expect, beforeEach } from "vitest";
import { applyEvents, getAllVehicles, clearStore } from "../src/store/vehicleStore";

describe("vehicleStore", () => {
  beforeEach(() => {
    clearStore();
  });

  it("stores a new vehicle event", () => {
    applyEvents([
      {
        vehicleId: "v-001",
        timestamp: "2024-01-01T10:00:00Z",
        lat: 51.5,
        lon: -0.1,
        speed: 60,
        fuelLevel: 80,
      },
    ]);

    const vehicles = getAllVehicles();
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].vehicleId).toBe("v-001");
    expect(vehicles[0].speed).toBe(60);
  });

  it("keeps only the latest event per vehicle when a newer one arrives", () => {
    applyEvents([
      {
        vehicleId: "v-001",
        timestamp: "2024-01-01T10:00:00Z",
        lat: 51.5,
        lon: -0.1,
        speed: 60,
        fuelLevel: 80,
      },
    ]);

    applyEvents([
      {
        vehicleId: "v-001",
        timestamp: "2024-01-01T10:05:00Z",
        lat: 51.6,
        lon: -0.2,
        speed: 90,
        fuelLevel: 75,
      },
    ]);

    const vehicles = getAllVehicles();
    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].speed).toBe(90);
    expect(vehicles[0].timestamp).toBe("2024-01-01T10:05:00Z");
  });

  it("does NOT overwrite with an older event", () => {
    applyEvents([
      {
        vehicleId: "v-001",
        timestamp: "2024-01-01T10:05:00Z",
        lat: 51.6,
        lon: -0.2,
        speed: 90,
        fuelLevel: 75,
      },
    ]);

    // Send an older event — should be ignored
    applyEvents([
      {
        vehicleId: "v-001",
        timestamp: "2024-01-01T09:00:00Z",
        lat: 51.0,
        lon: -0.0,
        speed: 10,
        fuelLevel: 99,
      },
    ]);

    const vehicles = getAllVehicles();
    expect(vehicles[0].speed).toBe(90); // still the newer value
  });

  it("tracks multiple vehicles independently", () => {
    applyEvents([
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
        speed: 40,
        fuelLevel: 50,
      },
    ]);

    const vehicles = getAllVehicles();
    expect(vehicles).toHaveLength(2);
  });
});
