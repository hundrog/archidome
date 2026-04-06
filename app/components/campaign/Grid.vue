<script setup lang="ts">
import type { Database } from "@/types/database.types";
import { useCampaignStore } from "~/stores/campaign";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

const store = useCampaignStore();
const {
  coords,
  loading: geoLoading,
  error: geoError,
  request: requestGeo,
} = useGeolocation();

const search = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val),
});
const modeFilter = computed({
  get: () => store.modeFilter,
  set: (val) => store.setModeFilter(val),
});
const nearbyOnly = computed({
  get: () => store.nearbyOnly,
  set: (val) => store.setNearbyOnly(val),
});
const radiusKm = computed({
  get: () => store.radiusKm,
  set: (val) => store.setRadiusKm(val),
});

// Fetch campaigns on mount
onMounted(async () => {
  await store.fetchCampaigns();
});

// Update user coords when geolocation changes
watch(
  () => coords.value,
  (newCoords) => {
    if (newCoords) {
      store.setUserCoords(newCoords);
    }
  },
);

async function toggleNearby() {
  if (!store.nearbyOnly) {
    if (!coords.value) await requestGeo();
    if (coords.value) store.setNearbyOnly(true);
  } else {
    store.setNearbyOnly(false);
  }
}

function getDistance(campaign: Campaign): string | null {
  return store.getDistance(campaign);
}
</script>

<template>
  <div class="bg-surface min-h-screen">
    <!-- ── Hero ── -->
    <section
      class="relative min-h-130 flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      <!-- Fondo estrellado -->
      <div class="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80"
          alt=""
          class="w-full h-full object-cover object-center"
        />
        <!-- Overlay oscuro -->
        <div class="absolute inset-0 bg-surface/60" />
        <!-- Fade radial desde el centro hacia los 4 bordes -->
        <div
          class="absolute inset-0"
          style="
            background: radial-gradient(
              ellipse at center,
              transparent 0%,
              transparent 50%,
              #0d072e 65%
            );
          "
        />
      </div>
      <!-- Contenido -->
      <div class="relative z-10 w-full text-center space-y-6">
        <!-- Eyebrow -->
        <span
          class="label-metadata text-primary inline-flex items-center gap-2"
        >
          <UIcon name="i-lucide-compass" class="size-3" />
          El portal está abierto
        </span>

        <!-- Título -->
        <h1
          class="font-display text-display-md sm:text-display-lg text-on-surface leading-tight"
        >
          Encuentra tu
          <span
            class="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            próxima aventura
          </span>
        </h1>

        <!-- Subtítulo -->
        <p class="font-body text-body-lg text-on-surface-dim max-w-xl mx-auto">
          Conectando masters y jugadores a través del mundo. Tu próxima campaña
          épica comienza con un click.
        </p>

        <!-- Filtros -->
        <CampaignSearchBar
          v-model:search="search"
          v-model:mode="modeFilter"
          v-model:nearby="nearbyOnly"
          v-model:radius="radiusKm"
          :geo-loading="geoLoading"
          :geo-error="geoError"
          :has-coords="!!coords"
          @toggle-nearby="toggleNearby"
        />
      </div>
    </section>

    <!-- Skeleton -->
    <div
      v-if="store.loading"
      class="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-2xl overflow-hidden bg-gray-900 animate-pulse"
      >
        <div class="h-48 bg-gray-800" />
        <div class="p-5 space-y-3">
          <div class="h-4 bg-gray-800 rounded w-3/4" />
          <div class="h-3 bg-gray-800 rounded w-1/2" />
          <div class="h-3 bg-gray-800 rounded w-full" />
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div
      v-else-if="store.filteredCampaigns.length"
      class="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <CampaignCard
        v-for="campaign in store.filteredCampaigns"
        :key="campaign.id"
        :campaign="campaign"
        :distance="getDistance(campaign)"
      />
    </div>

    <!-- Empty -->
    <div
      v-else
      class="w-full mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <UIcon name="i-lucide-scroll" class="size-14 text-gray-700" />
      <p class="text-gray-400 text-lg font-medium">No hay campañas</p>
      <p class="text-gray-600 text-sm">
        {{
          store.nearbyOnly
            ? `No hay campañas en ${store.radiusKm} km de tu ubicación`
            : store.searchQuery || store.modeFilter
              ? "Intenta con otros filtros"
              : "Sé el primero en crear una"
        }}
      </p>
      <UButton
        v-if="store.nearbyOnly"
        variant="ghost"
        icon="i-lucide-map-pin-off"
        label="Ver todas"
        @click="store.setNearbyOnly(false)"
      />
      <UButton
        v-else-if="store.searchQuery || store.modeFilter"
        variant="ghost"
        icon="i-lucide-x"
        label="Limpiar filtros"
        @click="
          store.setSearchQuery('');
          store.setModeFilter(null);
        "
      />
      <UButton
        v-else
        to="/campaigns/new"
        icon="i-lucide-plus"
        label="Crear campaña"
        size="lg"
      />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
