<script setup lang="ts">
import { useSupabaseClient } from '#imports'
import { campaignSchema } from '~/schemas/campaign'
import type { Database } from '@/types/database.types'
import type { CampaignForm } from '~/schemas/campaign'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
type CampaignFormState = CampaignForm

// ─── Setup ───────────────────────────────────────────────────────────────────
const props = defineProps<{ campaignId?: string }>()
const isEditMode = computed(() => !!props.campaignId)
const supabase = useSupabaseClient()
const toast    = useToast()
const campaign = ref<Campaign | null>(null)
const existingImageUrl = ref<string | null>(null)
const loading      = ref(false)
const imageFile    = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
// Coordenadas resueltas por el geocoder
const resolvedCoords = ref<{ lat: number; lng: number } | null>(null)

function onLocationUpdate(payload: { lat: number | null; lng: number | null; locationName: string | null }) {
  state.lat = payload.lat ?? undefined
  state.lng = payload.lng ?? undefined
  state.location_name = payload.locationName ?? ''
}

// ─── Proyectos ────────────────────────────────────────────────────────────────
const { data: projects } = await useAsyncData('projects', async () => {
  const { data } = await supabase.from('projects').select('id, name')
  return data ?? []
})

if (props.campaignId) {
  const campaignId = props.campaignId
  const { data } = await useAsyncData(`campaign-${campaignId}`, async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) throw error
    return data as Campaign
  })

  if (data.value) {
    campaign.value = data.value
    existingImageUrl.value = data.value.image_url
  }
}

const projectOptions = computed(() =>
  (projects.value ?? []).map((p: any) => ({ label: p.name, value: p.id }))
)

const playModeOptions = [
  { label: 'Remoto',     value: 'remote' },
  { label: 'Presencial', value: 'in_person' },
  { label: 'Híbrido',    value: 'hybrid' }
]

// ─── Estado ───────────────────────────────────────────────────────────────────
const state = reactive<Partial<CampaignFormState>>({
  title:         '',
  system:        '',
  description:   '',
  play_mode:     'remote',
  contact:       '',
  project_id:    undefined,
  location_name: '',
  image:         undefined
})

watch(campaign, (value) => {
  if (!value) return
  Object.assign(state, {
    title:         value.title,
    system:        value.system,
    description:   value.description,
    play_mode:     value.play_mode,
    contact:       value.contact,
    project_id:    value.project_id,
    location_name: value.location_name ?? '',
    image:         undefined,
    lat:           value.lat,
    lng:           value.lng,
  })
  imagePreview.value = value.image_url
}, { immediate: true })

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
    let imageUrl: string | null = isEditMode.value ? existingImageUrl.value : null
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

    let error
    if (isEditMode.value && props.campaignId) {
      const campaignId = props.campaignId
      const result = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', campaignId)
      error = result.error
    } else {
      const result = await supabase.from('campaigns').insert(payload)
      error = result.error
    }

    if (error) throw new Error(error.message)

    const successTitle = isEditMode.value ? '¡Campaña actualizada!' : '¡Campaña creada!'
    const successDescription = isEditMode.value
      ? `"${state.title}" fue actualizada.`
      : `"${state.title}" fue guardada.`

    toast.add({ title: successTitle, description: successDescription, color: 'success' })

    if (isEditMode.value && props.campaignId) {
      await navigateTo(`/campaigns/${props.campaignId}`)
      return
    }

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
      <CampaignsLocationField
        v-if="showLocation"
        @update="onLocationUpdate"
      />
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
