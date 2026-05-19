export interface TelemetryEvent {
  vehicleId: string;
  timestamp: string; // ISO 8601
  lat: number;
  lon: number;
  speed: number;    // km/h
  fuelLevel: number; // 0–100 percent
}

export interface VehicleState extends TelemetryEvent {
  lastUpdated: string;
}
