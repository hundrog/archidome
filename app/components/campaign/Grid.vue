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

const playModeConfig = {
  remote: { label: 'Remoto', icon: 'i-lucide-monitor', color: 'info' },
  in_person: { label: 'Presencial', icon: 'i-lucide-users', color: 'success' },
  hybrid: { label: 'Híbrido', icon: 'i-lucide-shuffle', color: 'warning' }
} as const

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

const PLACEHOLDER = 'https://placehold.co/600x340/1a1a2e/e2c97e?text=Sin+imagen'
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
      <NuxtLink
        v-for="campaign in store.filteredCampaigns"
        :key="campaign.id"
        :to="`/campaigns/${campaign.id}`"
        class="group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800
               hover:border-gray-600 transition-all duration-300
               hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 flex flex-col"
      >
        <div class="relative h-48 overflow-hidden bg-gray-800 shrink-0">
          <img
            :src="campaign.image_url ?? PLACEHOLDER"
            :alt="campaign.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute top-3 right-3 flex flex-col items-end gap-1">
            <UBadge
              :color="playModeConfig[campaign.play_mode].color"
              variant="solid"
              size="sm"
              :label="playModeConfig[campaign.play_mode].label"
            >
              <template #leading>
                <UIcon :name="playModeConfig[campaign.play_mode].icon" class="size-3" />
              </template>
            </UBadge>
            <UBadge v-if="getDistance(campaign)" color="neutral" variant="solid" size="sm">
              <template #leading><UIcon name="i-lucide-map-pin" class="size-3" /></template>
              {{ getDistance(campaign) }}
            </UBadge>
          </div>
        </div>

        <div class="p-5 flex flex-col flex-1 gap-3">
          <div>
            <h2 class="text-lg font-semibold text-white leading-snug line-clamp-1 group-hover:text-primary-400 transition-colors">
              {{ campaign.title }}
            </h2>
            <p class="text-xs text-primary-400 font-medium mt-0.5 uppercase tracking-wide">{{ campaign.system }}</p>
          </div>
          <p class="text-sm text-gray-400 line-clamp-3 flex-1">{{ campaign.description }}</p>
          <div class="flex items-center justify-between pt-2 border-t border-gray-800 mt-auto">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon name="i-lucide-message-circle" class="size-4 text-gray-500 shrink-0" />
              <span class="text-xs text-gray-500 truncate">{{ campaign.contact }}</span>
            </div>
            <div v-if="campaign.location_name" class="flex items-center gap-1 ml-2 shrink-0">
              <UIcon name="i-lucide-map-pin" class="size-3 text-gray-600" />
              <span class="text-xs text-gray-600 truncate max-w-24">{{ campaign.location_name.split(',')[0] }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
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
