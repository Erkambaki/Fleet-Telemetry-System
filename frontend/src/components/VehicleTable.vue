<template>
  <div>
    <!-- Stats bar -->
    <v-row class="mb-4" dense>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" color="surface" rounded="lg">
          <v-card-text class="text-center pa-3">
            <div class="stat-number primary--text">{{ vehicles.length }}</div>
            <div class="stat-label">TOTAL VEHICLES</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" color="surface" rounded="lg">
          <v-card-text class="text-center pa-3">
            <div class="stat-number" style="color: #00ff88">{{ movingCount }}</div>
            <div class="stat-label">MOVING</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" color="surface" rounded="lg">
          <v-card-text class="text-center pa-3">
            <div class="stat-number" style="color: #ffb300">{{ idleCount }}</div>
            <div class="stat-label">IDLE</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="stat-card" color="surface" rounded="lg">
          <v-card-text class="text-center pa-3">
            <div class="stat-number" style="color: #ff4444">{{ lowFuelCount }}</div>
            <div class="stat-label">LOW FUEL</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Search & filter -->
    <v-row class="mb-3" dense>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search vehicle ID..."
          variant="outlined"
          density="compact"
          clearable
          hide-details
          class="search-field"
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="statusFilter"
          :items="['All', 'Moving', 'Idle', 'Low Fuel']"
          label="Status"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="3" class="d-flex align-center justify-end">
        <v-chip
          :color="autoRefresh ? 'primary' : 'grey'"
          variant="outlined"
          class="mr-2"
          size="small"
        >
          <v-icon start size="12">mdi-circle</v-icon>
          {{ autoRefresh ? `Live · ${refreshCountdown}s` : "Paused" }}
        </v-chip>
        <v-btn
          :icon="autoRefresh ? 'mdi-pause' : 'mdi-play'"
          variant="text"
          size="small"
          @click="autoRefresh = !autoRefresh"
        />
      </v-col>
    </v-row>

    <!-- Data table -->
    <v-data-table
      :headers="headers"
      :items="filteredVehicles"
      :search="search"
      :loading="loading"
      density="compact"
      class="fleet-table"
      :items-per-page="25"
    >
      <!-- Vehicle ID -->
      <template #item.vehicleId="{ item }">
        <span class="vehicle-id">{{ item.vehicleId }}</span>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <v-chip
          :color="statusColor(item)"
          size="x-small"
          variant="flat"
          class="font-weight-bold"
        >
          {{ statusLabel(item) }}
        </v-chip>
      </template>

      <!-- Speed -->
      <template #item.speed="{ item }">
        <span :class="item.speed > 0 ? 'text-primary' : 'text-medium-emphasis'">
          {{ item.speed }} km/h
        </span>
      </template>

      <!-- Fuel -->
      <template #item.fuelLevel="{ item }">
        <div class="d-flex align-center gap-2">
          <v-progress-linear
            :model-value="item.fuelLevel"
            :color="fuelColor(item.fuelLevel)"
            height="6"
            rounded
            style="max-width: 60px"
          />
          <span class="text-caption">{{ item.fuelLevel }}%</span>
        </div>
      </template>

      <!-- Location -->
      <template #item.location="{ item }">
        <span class="mono text-caption text-medium-emphasis">
          {{ item.lat.toFixed(4) }}, {{ item.lon.toFixed(4) }}
        </span>
      </template>

      <!-- Last seen -->
      <template #item.lastUpdated="{ item }">
        <span class="text-caption text-medium-emphasis">
          {{ timeAgo(item.lastUpdated) }}
        </span>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { VehicleState } from "../api/vehicles";

const props = defineProps<{ vehicles: VehicleState[]; loading: boolean }>();

const search = ref("");
const statusFilter = ref("All");
const autoRefresh = ref(true);
const refreshCountdown = ref(5);

// ── Derived counts ────────────────────────────────────────────────────────────
const movingCount = computed(
  () => props.vehicles.filter((v) => v.speed > 0).length
);
const idleCount = computed(
  () => props.vehicles.filter((v) => v.speed === 0).length
);
const lowFuelCount = computed(
  () => props.vehicles.filter((v) => v.fuelLevel < 20).length
);

// ── Table headers ─────────────────────────────────────────────────────────────
const headers = [
  { title: "Vehicle ID", key: "vehicleId", sortable: true },
  { title: "Status", key: "status", sortable: false },
  { title: "Speed", key: "speed", sortable: true },
  { title: "Fuel", key: "fuelLevel", sortable: true },
  { title: "Location", key: "location", sortable: false },
  { title: "Last seen", key: "lastUpdated", sortable: true },
];

// ── Filtering ─────────────────────────────────────────────────────────────────
const filteredVehicles = computed(() => {
  return props.vehicles.filter((v) => {
    if (statusFilter.value === "Moving" && v.speed === 0) return false;
    if (statusFilter.value === "Idle" && v.speed > 0) return false;
    if (statusFilter.value === "Low Fuel" && v.fuelLevel >= 20) return false;
    return true;
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusColor(v: VehicleState): string {
  if (v.fuelLevel < 20) return "error";
  return v.speed > 0 ? "success" : "warning";
}

function statusLabel(v: VehicleState): string {
  if (v.fuelLevel < 20) return "LOW FUEL";
  return v.speed > 0 ? "MOVING" : "IDLE";
}

function fuelColor(level: number): string {
  if (level < 20) return "#ff4444";
  if (level < 40) return "#ffb300";
  return "#00ff88";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ── Countdown display (purely visual; parent controls actual refresh) ──────────
const emit = defineEmits(["refresh"]);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function startCountdown() {
  refreshCountdown.value = 5;
  countdownTimer = setInterval(() => {
    if (!autoRefresh.value) return;
    refreshCountdown.value--;
    if (refreshCountdown.value <= 0) {
      emit("refresh");
      refreshCountdown.value = 5;
    }
  }, 1000);
}

watch(autoRefresh, (val) => {
  if (!val && countdownTimer) clearInterval(countdownTimer);
  if (val) startCountdown();
});

onMounted(startCountdown);
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<style scoped>
.stat-card {
  border: 1px solid rgba(0, 229, 255, 0.15);
  transition: border-color 0.2s;
}
.stat-card:hover {
  border-color: rgba(0, 229, 255, 0.4);
}
.stat-number {
  font-family: "Rajdhani", sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #00e5ff;
  line-height: 1;
}
.stat-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
}
.vehicle-id {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.8rem;
  color: #00e5ff;
}
.mono {
  font-family: "IBM Plex Mono", monospace;
}
.fleet-table {
  background: #111827 !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}
</style>
