<script setup lang="ts">
import { z } from 'zod'
import { useSupabaseClient } from '#imports'
import type { Database } from '@/types/database.types'
const { fuzzCoords }     = useFuzzCoords()
const { coords, request: requestGeo, loading: geoLoading } = useGeolocation()

type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']

// ─── Schema ───────────────────────────────────────────────────────────────────
const campaignSchema = z.object({
  title:         z.string().min(3, 'El título es muy corto'),
  system:        z.string().min(2, 'Especifica el sistema (ej: Fabula Ultima)'),
  description:   z.string().min(10, 'Cuéntanos un poco más de la trama'),
  play_mode:     z.enum(['remote', 'in_person', 'hybrid']),
  contact:       z.string().min(3, '¿Cómo te contactan los jugadores?'),
  project_id:    z.string().uuid('Debes seleccionar un proyecto'),
  location_name: z.string().optional(),
  image:         z.any().optional()
})

type CampaignForm = z.output<typeof campaignSchema>

// ─── Setup ────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient()
const toast    = useToast()
const { geocode, loading: geocoding, error: geocodeError } = useGeocoder()

const loading      = ref(false)
const imageFile    = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Coordenadas resueltas por el geocoder
const resolvedCoords = ref<{ lat: number; lng: number } | null>(null)

// ─── Proyectos ────────────────────────────────────────────────────────────────
const { data: projects } = await useAsyncData('projects', async () => {
  const { data } = await supabase.from('projects').select('id, name')
  return data ?? []
})

const projectOptions = computed(() =>
  (projects.value ?? []).map((p: any) => ({ label: p.name, value: p.id }))
)

const playModeOptions = [
  { label: 'Remoto',     value: 'remote' },
  { label: 'Presencial', value: 'in_person' },
  { label: 'Híbrido',    value: 'hybrid' }
]

// ─── Estado ───────────────────────────────────────────────────────────────────
const state = reactive<Partial<CampaignForm>>({
  title:         '',
  system:        '',
  description:   '',
  play_mode:     'remote',
  contact:       '',
  project_id:    undefined,
  location_name: '',
  image:         undefined
})

// Solo mostrar campo de ubicación si el modo no es remoto
const showLocation = computed(() =>
  state.play_mode === 'in_person' || state.play_mode === 'hybrid'
)

// Resetear ubicación si cambia a remoto
watch(() => state.play_mode, (mode) => {
  if (mode === 'remote') {
    state.location_name  = ''
    resolvedCoords.value = null
  }
})

// ─── Geocodificar al salir del campo ─────────────────────────────────────────
async function onLocationBlur() {
  if (!state.location_name?.trim()) {
    resolvedCoords.value = null
    return
  }
  const result = await geocode(state.location_name)
  if (result) {
    resolvedCoords.value = fuzzCoords(result.lat, result.lng) // 👈 fuzzing también al geocoder
    toast.add({
      title: '📍 Ubicación encontrada',
      description: result.displayName.split(',').slice(0, 3).join(','),
      color: 'success'
    })
  } else {
    resolvedCoords.value = null
    toast.add({ title: 'Ubicación no encontrada', color: 'warning' })
  }
}
// --- Opción para usar ubicación actual del usuario
async function useMyLocation() {
  await requestGeo()
  if (!coords.value) {
    toast.add({ title: 'No se pudo obtener tu ubicación', color: 'error' })
    return
  }

  // Fuzzear antes de hacer reverse geocoding
  const fuzzed = fuzzCoords(coords.value.lat, coords.value.lng)
  resolvedCoords.value = fuzzed

  // Reverse geocode para obtener nombre de ciudad
  const data = await $fetch<{ found: boolean; locationName: string | null }>(
    '/api/reverse-geocode',
    { query: { lat: fuzzed.lat, lng: fuzzed.lng } }
  )

  if (data.found && data.locationName) {
    state.location_name = data.locationName
    toast.add({
      title: '📍 Ubicación guardada',
      description: data.locationName,
      color: 'success'
    })
  } else {
    toast.add({ title: 'No se pudo resolver la ciudad', color: 'warning' })
  }
}

// ─── Imagen ───────────────────────────────────────────────────────────────────
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({ title: 'Archivo inválido', description: 'Solo se permiten imágenes.', color: 'error' })
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'Imagen muy grande', description: 'El límite es 5 MB.', color: 'error' })
    return
  }

  imageFile.value    = file
  state.image        = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imageFile.value    = null
  imagePreview.value = null
  state.image        = undefined
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ─── Subida de imagen ─────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const { data: { user } } = await supabase.auth.getUser()
  const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('campaign-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  const { data } = supabase.storage.from('campaign-images').getPublicUrl(fileName)
  return data.publicUrl
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function onSubmit() {
  loading.value = true
  try {
    let imageUrl: string | null = null
    if (imageFile.value) imageUrl = await uploadImage(imageFile.value)

    const { data: { user } } = await supabase.auth.getUser()

    const payload: CampaignInsert = {
      title:         state.title!,
      system:        state.system!,
      description:   state.description!,
      play_mode:     state.play_mode!,
      contact:       state.contact!,
      project_id:    state.project_id!,
      image_url:     imageUrl,
      user_id:       user!.id,
      location_name: showLocation.value ? (state.location_name ?? null) : null,
      lat:           showLocation.value ? (resolvedCoords.value?.lat ?? null) : null,
      lng:           showLocation.value ? (resolvedCoords.value?.lng ?? null) : null
    }

    const { error } = await supabase.from('campaigns').insert(payload)
    if (error) throw new Error(error.message)

    toast.add({ title: '¡Campaña creada!', description: `"${state.title}" fue guardada.`, color: 'success' })

    Object.assign(state, {
      title: '', system: '', description: '', play_mode: 'remote',
      contact: '', project_id: undefined, location_name: '', image: undefined
    })
    resolvedCoords.value = null
    removeImage()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="campaignSchema" :state="state" class="space-y-6" @submit="onSubmit">

    <UFormField label="Título de la campaña" name="title" required>
      <UInput v-model="state.title" placeholder="Ej: La Sombra de Uldra" size="lg" class="w-full" />
    </UFormField>

    <UFormField label="Sistema de juego" name="system" required>
      <UInput v-model="state.system" placeholder="Ej: Fabula Ultima, D&D 5e…" size="lg" class="w-full" />
    </UFormField>

    <UFormField label="Descripción / Trama" name="description" required>
      <UTextarea v-model="state.description" placeholder="Cuéntale a los jugadores de qué va la campaña…" :rows="4" size="lg" class="w-full" />
    </UFormField>

    <UFormField label="Modo de juego" name="play_mode" required>
      <USelectMenu
        v-model="state.play_mode"
        :items="playModeOptions"
        value-key="value"
        label-key="label"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Ubicación: solo para presencial e híbrido -->
    <Transition name="fade">
    <UFormField
      v-if="showLocation"
      label="Ciudad / Ubicación"
      name="location_name"
      :hint="resolvedCoords ? '✅ Ubicación verificada' : 'Escribe tu ciudad o usa tu ubicación actual'"
    >
      <div class="flex gap-2">
        <UInput
          v-model="state.location_name"
          placeholder="Ej: Guadalajara, Jalisco"
          size="lg"
          class="flex-1"
          :trailing-icon="resolvedCoords ? 'i-lucide-map-pin' : undefined"
          @blur="onLocationBlur"
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
  </Transition>

    <UFormField label="Proyecto" name="project_id" required>
      <USelectMenu
        v-model="state.project_id"
        :items="projectOptions"
        value-key="value"
        label-key="label"
        placeholder="Selecciona un proyecto"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Contacto" name="contact" required>
      <UInput v-model="state.contact" placeholder="Ej: Discord @usuario, email…" size="lg" class="w-full" />
    </UFormField>

    <!-- Imagen -->
    <UFormField label="Imagen de portada" name="image">
      <div class="space-y-3">
        <div
          v-if="imagePreview"
          class="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
          style="max-height: 220px;"
        >
          <img :src="imagePreview" alt="Preview" class="w-full object-cover" style="max-height: 220px;" />
          <UButton icon="i-lucide-x" color="error" variant="solid" size="xs" class="absolute top-2 right-2" @click="removeImage" />
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 cursor-pointer hover:border-primary-400 transition-colors"
          @click="fileInputRef?.click()"
        >
          <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Haz clic para subir una imagen</p>
          <p class="text-xs text-gray-400">PNG, JPG, WEBP · máx. 5 MB</p>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileChange" />
      </div>
    </UFormField>

    <div class="flex justify-end pt-2">
      <UButton type="submit" size="lg" :loading="loading" icon="i-lucide-save" label="Crear campaña" />
    </div>

  </UForm>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
