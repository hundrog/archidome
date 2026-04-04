<script setup lang="ts">
// components/campaign/LocationField.vue

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  update: [payload: { lat: number | null; lng: number | null; locationName: string | null }]
}>()

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  initialLocationName?: string | null
  initialLat?: number | null
  initialLng?: number | null
}>()

// ─── Setup ────────────────────────────────────────────────────────────────────
const toast                                          = useToast()
const { geocode, loading: geocoding, error: geocodeError } = useGeocoder()
const { fuzzCoords }                                 = useFuzzCoords()
const { coords, request: requestGeo, loading: geoLoading } = useGeolocation()

// ─── Estado ───────────────────────────────────────────────────────────────────
const locationName   = ref(props.initialLocationName ?? '')
const resolvedCoords = ref<{ lat: number; lng: number } | null>(
  props.initialLat && props.initialLng
    ? { lat: props.initialLat, lng: props.initialLng }
    : null
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emitUpdate(lat: number | null, lng: number | null, name: string | null) {
  emit('update', { lat, lng, locationName: name })
}

function clearLocation() {
  resolvedCoords.value = null
  emitUpdate(null, null, null)
}

// ─── Geocodificar al salir del campo ─────────────────────────────────────────
async function onBlur() {
  if (!locationName.value.trim()) {
    clearLocation()
    return
  }

  const result = await geocode(locationName.value)
  if (result) {
    const fuzzed = fuzzCoords(result.lat, result.lng)
    resolvedCoords.value = fuzzed
    emitUpdate(fuzzed.lat, fuzzed.lng, locationName.value)
    toast.add({
      title:       '📍 Ubicación encontrada',
      description: result.displayName.split(',').slice(0, 3).join(','),
      color:       'success'
    })
  } else {
    clearLocation()
    toast.add({
      title:       'Ubicación no encontrada',
      description: 'Intenta ser más específico (ej: "Guadalajara, Jalisco")',
      color:       'warning'
    })
  }
}

// ─── Usar ubicación del navegador ────────────────────────────────────────────
async function useMyLocation() {
  await requestGeo()

  if (!coords.value) {
    toast.add({ title: 'No se pudo obtener tu ubicación', color: 'error' })
    return
  }

  const fuzzed = fuzzCoords(coords.value.lat, coords.value.lng)
  resolvedCoords.value = fuzzed

  const data = await $fetch<{ found: boolean; locationName: string | null }>(
    '/api/reverse-geocode',
    { query: { lat: fuzzed.lat, lng: fuzzed.lng } }
  )

  if (data.found && data.locationName) {
    locationName.value = data.locationName
    emitUpdate(fuzzed.lat, fuzzed.lng, data.locationName)
    toast.add({
      title:       '📍 Ubicación guardada',
      description: data.locationName,
      color:       'success'
    })
  } else {
    emitUpdate(fuzzed.lat, fuzzed.lng, null)
    toast.add({ title: 'No se pudo resolver la ciudad', color: 'warning' })
  }
}
</script>

<template>
  <UFormField
    label="Ciudad / Ubicación"
    name="location_name"
    :hint="resolvedCoords ? '✅ Ubicación verificada' : 'Escribe tu ciudad o usa tu ubicación actual'"
  >
    <div class="flex gap-2">
      <UInput
        v-model="locationName"
        placeholder="Ej: Guadalajara, Jalisco"
        size="lg"
        class="flex-1"
        :trailing-icon="resolvedCoords ? 'i-lucide-map-pin' : undefined"
        @blur="onBlur"
      />
      <UButton
        icon="i-lucide-locate-fixed"
        size="lg"
        color="neutral"
        variant="outline"
        :loading="geoLoading"
        title="Usar mi ubicación actual"
        @click="useMyLocation"
      />
    </div>
    <p v-if="geocodeError" class="text-xs text-red-400 mt-1">{{ geocodeError }}</p>
  </UFormField>
</template>