import { TelemetryEvent, VehicleState } from "../types";

/**
 * In-memory store for the latest vehicle state.
 */
const store = new Map<string, VehicleState>();

/**
 * Upsert a batch of telemetry events.
 * Only keeps the most recent event per vehicle (by timestamp).
 */
export function applyEvents(events: TelemetryEvent[]): void {
  for (const event of events) {
    const existing = store.get(event.vehicleId);
    // Only overwrite if this event is newer than what we have
    if (!existing || event.timestamp > existing.timestamp) {
      store.set(event.vehicleId, {
        ...event,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

/** Return all known vehicle states as an array. */
export function getAllVehicles(): VehicleState[] {
  return Array.from(store.values());
}

/** Clear the store (used in tests). */
export function clearStore(): void {
  store.clear();
}
