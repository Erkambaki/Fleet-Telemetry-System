import { Router, Request, Response } from "express";
import { applyEvents, getAllVehicles } from "../store/vehicleStore";
import { TelemetryEvent } from "../types";

const router = Router();

/**
 * POST /telemetry
 * Accepts a batch of up to 100 telemetry events.
 * Body: { events: TelemetryEvent[] }
 */
router.post("/telemetry", (req: Request, res: Response) => {
  const { events } = req.body as { events: TelemetryEvent[] };

  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "Body must contain an 'events' array." });
  }

  if (events.length === 0) {
    return res.status(400).json({ error: "Events array must not be empty." });
  }

  if (events.length > 100) {
    return res
      .status(400)
      .json({ error: "Batch size exceeds limit of 100 events." });
  }

  // Basic field validation
  for (const e of events) {
    if (
      typeof e.vehicleId !== "string" ||
      typeof e.timestamp !== "string" ||
      typeof e.lat !== "number" ||
      typeof e.lon !== "number" ||
      typeof e.speed !== "number" ||
      typeof e.fuelLevel !== "number"
    ) {
      return res.status(400).json({
        error: "Each event must have vehicleId, timestamp, lat, lon, speed, fuelLevel.",
      });
    }
  }

  applyEvents(events);

  return res.status(200).json({ accepted: events.length });
});

/**
 * GET /vehicles/latest
 * Returns the most recent known state for every vehicle.
 */
router.get("/vehicles/latest", (_req: Request, res: Response) => {
  const vehicles = getAllVehicles();
  return res.status(200).json({ vehicles, count: vehicles.length });
});

export default router;
