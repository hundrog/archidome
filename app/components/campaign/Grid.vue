<script setup lang="ts">
import type { Database } from '@/types/database.types'

type Campaign = Database['public']['Tables']['campaigns']['Row']

// ─── Config ───────────────────────────────────────────────────────────────────
const playModeConfig = {
  remote:    { label: 'Remoto',     icon: 'i-lucide-monitor', color: 'info' },
  in_person: { label: 'Presencial', icon: 'i-lucide-users',   color: 'success' },
  hybrid:    { label: 'Híbrido',    icon: 'i-lucide-shuffle', color: 'warning' }
} as const

// ─── Setup ────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { coords, loading: geoLoading, error: geoError, request: requestGeo } = useGeolocation()

const search     = ref('')
const modeFilter = ref<string | null>(null)
const radiusKm   = ref(50)
const nearbyOnly = ref(false)

const modeFilterOptions = [
  { label: 'Todos',      value: null },
  { label: 'Remoto',     value: 'remote' },
  { label: 'Presencial', value: 'in_person' },
  { label: 'Híbrido',    value: 'hybrid' }
]

const radiusOptions = [
  { label: '25 km',  value: 25 },
  { label: '50 km',  value: 50 },
  { label: '100 km', value: 100 },
  { label: '200 km', value: 200 }
]

// ─── Geolocalización ──────────────────────────────────────────────────────────
async function toggleNearby() {
  if (!nearbyOnly.value) {
    if (!coords.value) await requestGeo()
    if (coords.value) nearbyOnly.value = true
  } else {
    nearbyOnly.value = false
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
const { data: campaigns, pending } = await useAsyncData('campaigns', async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Campaign[]
})

// ─── Haversine ────────────────────────────────────────────────────────────────
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dO = ((lng2 - lng1) * Math.PI) / 180
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dO / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Filtrado ─────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = campaigns.value ?? []

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.system.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    )
  }

  if (modeFilter.value) {
    list = list.filter(c => c.play_mode === modeFilter.value)
  }

  if (nearbyOnly.value && coords.value) {
    list = list.filter(c => {
      if (c.play_mode === 'remote') return true
      if (!c.lat || !c.lng) return false
      return distanceKm(coords.value!.lat, coords.value!.lng, c.lat, c.lng) <= radiusKm.value
    })

    list = [...list].sort((a, b) => {
      if (a.play_mode === 'remote') return 1
      if (b.play_mode === 'remote') return -1
      if (!a.lat || !b.lat) return 0
      return (
        distanceKm(coords.value!.lat, coords.value!.lng, a.lat!, a.lng!) -
        distanceKm(coords.value!.lat, coords.value!.lng, b.lat!, b.lng!)
      )
    })
  }

  return list
})

function getDistance(c: Campaign): string | null {
  if (!nearbyOnly.value || !coords.value || !c.lat || !c.lng) return null
  const km = distanceKm(coords.value.lat, coords.value.lng, c.lat, c.lng)
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`
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
    <div class="max-w-7xl mx-auto space-y-3 mb-8">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Buscar por título, sistema…" size="lg" class="flex-1" />
        <USelectMenu
          v-model="modeFilter"
          :items="modeFilterOptions"
          value-key="value"
          label-key="label"
          placeholder="Modo de juego"
          size="lg"
          class="w-full sm:w-48"
        />
      </div>

      <!-- Cercanía -->
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          :icon="nearbyOnly ? 'i-lucide-map-pin' : 'i-lucide-map-pin-off'"
          :color="nearbyOnly ? 'primary' : 'neutral'"
          :variant="nearbyOnly ? 'solid' : 'outline'"
          :loading="geoLoading"
          size="sm"
          :label="nearbyOnly ? 'Cerca de mí' : 'Mostrar cercanas'"
          @click="toggleNearby"
        />
        <Transition name="fade">
          <USelectMenu
            v-if="nearbyOnly"
            v-model="radiusKm"
            :items="radiusOptions"
            value-key="value"
            label-key="label"
            size="sm"
            class="w-32"
          />
        </Transition>
        <p v-if="geoError && !coords" class="text-xs text-red-400">{{ geoError }}</p>
        <p v-if="nearbyOnly && coords" class="text-xs text-gray-500">
          Presenciales e híbridas a menos de {{ radiusKm }} km · Las remotas siempre aparecen
        </p>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div v-else-if="filtered.length" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="campaign in filtered"
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
            <UBadge :color="playModeConfig[campaign.play_mode].color" variant="solid" size="sm" :label="playModeConfig[campaign.play_mode].label">
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
    <div v-else-if="user" class="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center">
      <UIcon name="i-lucide-scroll" class="size-14 text-gray-700" />
      <p class="text-gray-400 text-lg font-medium">No hay campañas</p>
      <p class="text-gray-600 text-sm">
        {{ nearbyOnly ? `No hay campañas en ${radiusKm} km de tu ubicación` : search || modeFilter ? 'Intenta con otros filtros' : 'Sé el primero en crear una' }}
      </p>
      <UButton v-if="nearbyOnly" variant="ghost" icon="i-lucide-map-pin-off" label="Ver todas" @click="nearbyOnly = false" />
      <UButton v-else-if="search || modeFilter" variant="ghost" icon="i-lucide-x" label="Limpiar filtros" @click="search = ''; modeFilter = null" />
      <UButton v-else to="/campaigns/new" icon="i-lucide-plus" label="Crear campaña" size="lg" />
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>