<script setup lang="ts">
import type { Database } from '@/types/database.types'
import { useCampaignStore } from '~/stores/campaign'

type Campaign = Database['public']['Tables']['campaigns']['Row']

const store = useCampaignStore()
const { coords, loading: geoLoading, error: geoError, request: requestGeo } = useGeolocation()

const search     = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val)
})
const modeFilter = computed({
  get: () => store.modeFilter,
  set: (val) => store.setModeFilter(val)
})
const nearbyOnly = computed({
  get: () => store.nearbyOnly,
  set: (val) => store.setNearbyOnly(val)
})
const radiusKm = computed({
  get: () => store.radiusKm,
  set: (val) => store.setRadiusKm(val)
})

// Fetch campaigns on mount
onMounted(async () => {
  await store.fetchCampaigns()
})

// Update user coords when geolocation changes
watch(() => coords.value, (newCoords) => {
  if (newCoords) {
    store.setUserCoords(newCoords)
  }
})

async function toggleNearby() {
  if (!store.nearbyOnly) {
    if (!coords.value) await requestGeo()
    if (coords.value) store.setNearbyOnly(true)
  } else {
    store.setNearbyOnly(false)
  }
}

function getDistance(campaign: Campaign): string | null {
  return store.getDistance(campaign)
}
</script>

<template>
  <div class="min-h-screen">
    <div class="flex justify-between max-w-7xl mx-auto mb-8 items-center">
      <div class="">
        <h1 class="text-4xl font-bold tracking-tight text-white mb-1">Campañas</h1>
        <p class="text-gray-400 text-sm">Encuentra tu próxima aventura</p>
      </div>
      <div class="">
        <UButton
          to="/campaigns/new"
          icon="i-lucide-plus"
          label="Crear campaña"
          size="lg"
        />
      </div>
    </div>

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

    <!-- Skeleton -->
    <div v-if="store.loading" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="rounded-2xl overflow-hidden bg-gray-900 animate-pulse">
        <div class="h-48 bg-gray-800" />
        <div class="p-5 space-y-3">
          <div class="h-4 bg-gray-800 rounded w-3/4" />
          <div class="h-3 bg-gray-800 rounded w-1/2" />
          <div class="h-3 bg-gray-800 rounded w-full" />
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div v-else-if="store.filteredCampaigns.length" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <CampaignCard
        v-for="campaign in store.filteredCampaigns"
        :key="campaign.id"
        :campaign="campaign"
        :distance="getDistance(campaign)"
      />
    </div>

    <!-- Empty -->
    <div v-else class="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
      <UIcon name="i-lucide-scroll" class="size-14 text-gray-700" />
      <p class="text-gray-400 text-lg font-medium">No hay campañas</p>
      <p class="text-gray-600 text-sm">
        {{
          store.nearbyOnly
            ? `No hay campañas en ${store.radiusKm} km de tu ubicación`
            : store.searchQuery || store.modeFilter
              ? 'Intenta con otros filtros'
              : 'Sé el primero en crear una'
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
        @click="store.setSearchQuery(''); store.setModeFilter(null)"
      />
      <UButton v-else to="/campaigns/new" icon="i-lucide-plus" label="Crear campaña" size="lg" />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
