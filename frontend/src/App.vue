<template>
  <v-app>
    <v-app-bar flat color="surface" border="b">
      <v-app-bar-title>
        <span class="brand">MCF</span>
        <span class="brand-sub">Fleet Telemetry</span>
      </v-app-bar-title>
      <template #append>
        <v-btn
          v-if="simulating"
          variant="outlined"
          size="small"
          color="error"
          class="mr-3"
          @click="stopSimulator"
        >
          <v-icon start>mdi-stop</v-icon>
          Stop Simulator
        </v-btn>
        <v-btn
          v-else
          variant="outlined"
          size="small"
          color="primary"
          class="mr-3"
          :loading="seeding"
          @click="seedData"
        >
          <v-icon start>mdi-database-plus</v-icon>
          Seed 500 Vehicles
        </v-btn>
        <v-btn
          variant="text"
          size="small"
          icon="mdi-refresh"
          :loading="loading"
          @click="fetchVehicles"
        />
      </template>
    </v-app-bar>

    <v-main style="background: #0a0e1a; min-height: 100vh">
      <v-container fluid class="pa-4">
        <!-- Error alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <VehicleTable
          :vehicles="vehicles"
          :loading="loading"
          @refresh="fetchVehicles"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { fetchLatestVehicles, postTelemetry, VehicleState } from "./api/vehicles";
import VehicleTable from "./components/VehicleTable.vue";

const vehicles = ref<VehicleState[]>([]);
const loading = ref(false);
const seeding = ref(false);
const simulating = ref(false);
const error = ref("");

// Tracks current simulated state so each update moves from the last position
const simulatedState = ref<Record<string, { lat: number; lon: number; speed: number; fuelLevel: number }>>({});
let simulatorInterval: ReturnType<typeof setInterval> | null = null;

// Auto-refresh interval (5 seconds)
let refreshInterval: ReturnType<typeof setInterval> | null = null;

async function fetchVehicles() {
  loading.value = true;
  try {
    vehicles.value = await fetchLatestVehicles();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

/**
 * Generates and posts 500 simulated vehicles in batches of 100.
 * This is for demo/interview purposes to populate the dashboard quickly.
 */
async function seedData() {
  seeding.value = true;
  try {
    const allEvents = Array.from({ length: 500 }, (_, i) => {
      const lat = 48.8 + (Math.random() - 0.5) * 10;
      const lon = 2.35 + (Math.random() - 0.5) * 10;
      const speed = Math.random() > 0.3 ? Math.round(Math.random() * 130) : 0;
      const fuelLevel = Math.round(Math.random() * 100);
      const vehicleId = `VEH-${String(i + 1).padStart(4, "0")}`;

      // Store initial state for the simulator to evolve from
      simulatedState.value[vehicleId] = { lat, lon, speed, fuelLevel };

      return { vehicleId, timestamp: new Date().toISOString(), lat, lon, speed, fuelLevel };
    });

    // Post in batches of 100 (as per API limit)
    for (let i = 0; i < allEvents.length; i += 100) {
      await postTelemetry(allEvents.slice(i, i + 100));
    }

    await fetchVehicles();
    startSimulator();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    seeding.value = false;
  }
}

/**
 * Continuously evolves vehicle state and posts updates every 3 seconds.
 * Each tick: moves position slightly, adjusts speed, drains fuel gradually.
 */
function startSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval);
  simulating.value = true;

  simulatorInterval = setInterval(async () => {
    const ids = Object.keys(simulatedState.value);
    // Only update a random 100 vehicles per tick (natural churn + respects batch limit)
    const batch = ids
      .sort(() => Math.random() - 0.5)
      .slice(0, 100)
      .map((vehicleId) => {
        const s = simulatedState.value[vehicleId];

        // Occasionally stop or start moving
        if (Math.random() < 0.05) s.speed = 0;
        else if (s.speed === 0 && Math.random() < 0.3) s.speed = Math.round(Math.random() * 80);

        // Move position proportional to speed
        if (s.speed > 0) {
          s.lat += (Math.random() - 0.5) * 0.01 * (s.speed / 50);
          s.lon += (Math.random() - 0.5) * 0.01 * (s.speed / 50);
        }

        // Drain fuel slowly; refuel when empty
        s.fuelLevel = s.fuelLevel > 1 ? +(s.fuelLevel - Math.random() * 0.5).toFixed(1) : 100;

        return {
          vehicleId,
          timestamp: new Date().toISOString(),
          lat: s.lat,
          lon: s.lon,
          speed: s.speed,
          fuelLevel: Math.round(s.fuelLevel),
        };
      });

    try {
      await postTelemetry(batch);
    } catch {
      // Silently skip failed ticks — don't interrupt the UI
    }
  }, 3000);
}

function stopSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval);
  simulating.value = false;
}

onMounted(() => {
  fetchVehicles();
  refreshInterval = setInterval(fetchVehicles, 5000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  stopSimulator();
});
</script>

<style>
* {
  box-sizing: border-box;
}

.brand {
  font-family: "Rajdhani", sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #00e5ff;
  letter-spacing: 0.05em;
  margin-right: 8px;
}

.brand-sub {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
