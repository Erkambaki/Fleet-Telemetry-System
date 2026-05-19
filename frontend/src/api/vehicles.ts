export interface VehicleState {
  vehicleId: string;
  timestamp: string;
  lat: number;
  lon: number;
  speed: number;
  fuelLevel: number;
  lastUpdated: string;
}

const BASE = "/api";

export async function fetchLatestVehicles(): Promise<VehicleState[]> {
  const res = await fetch(`${BASE}/vehicles/latest`);
  if (!res.ok) throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
  const data = await res.json();
  return data.vehicles as VehicleState[];
}

export async function postTelemetry(
  events: Omit<VehicleState, "lastUpdated">[]
): Promise<{ accepted: number }> {
  const res = await fetch(`${BASE}/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) throw new Error(`Failed to post telemetry: ${res.statusText}`);
  return res.json();
}
