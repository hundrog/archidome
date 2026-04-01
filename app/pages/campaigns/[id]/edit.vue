<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from '#imports'

// ─── Schema ───────────────────────────────────────────────────────────────────
import { campaignSchema } from '@/schemas/campaign'
import type { CampaignForm } from '@/schemas/campaign';

// ─── Setup ────────────────────────────────────────────────────────────────────
const route    = useRoute()
const router   = useRouter()
const supabase = useSupabaseClient()
const user     = useSupabaseUser()
const toast    = useToast()

const id = route.params.id as string

// ─── Fetch campaña ────────────────────────────────────────────────────────────
const { data: campaign } = await useAsyncData(`campaign-edit-${id}`, async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
})

// Protección: solo el dueño puede editar
if (!campaign.value) {
  throw createError({ statusCode: 404, message: 'Campaña no encontrada' })
}
if (campaign.value.user_id !== user.value?.sub) {
  // throw createError({ statusCode: 403, message: 'No tienes permiso para editar esta campaña' 
  navigateTo(`/campaigns/${id}`)
}

// ─── Proyectos ────────────────────────────────────────────────────────────────
const { data: projects } = await useAsyncData('projects-edit', async () => {
  const { data } = await supabase.from('projects').select('id, name')
  return data ?? []
})

const projectOptions = computed(() =>
  (projects.value ?? []).map((p: any) => ({ label: p.name, value: p.id }))
)

const playModeOptions = [
  { label: 'Remoto',      value: 'remote' },
  { label: 'Presencial',  value: 'in_person' },
  { label: 'Híbrido',     value: 'hybrid' }
]

// ─── Estado del form (pre-llenado) ───────────────────────────────────────────
const state = reactive<Partial<CampaignForm>>({
  title:       campaign.value.title,
  system:      campaign.value.system,
  description: campaign.value.description,
  play_mode:   campaign.value.play_mode,
  contact:     campaign.value.contact,
  project_id:  campaign.value.project_id,
  image:       undefined
})

// ─── Manejo de imagen ─────────────────────────────────────────────────────────
const imageFile    = ref<File | null>(null)
const imagePreview = ref<string | null>(campaign.value.image_url ?? null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const removeExistingImage = ref(false)

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
  removeExistingImage.value = false
}

function onRemoveImage() {
  imageFile.value    = null
  imagePreview.value = null
  state.image        = undefined
  removeExistingImage.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ─── Subida de imagen ─────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const ext      = file.name.split('.').pop()
  const fileName = `${user.value!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('campaign-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Error al subir imagen: ${error.message}`)

  const { data } = supabase.storage.from('campaign-images').getPublicUrl(fileName)
  return data.publicUrl
}

async function deleteOldImage(url: string) {
  const path = url.split('/campaign-images/')[1]
  if (path) await supabase.storage.from('campaign-images').remove([path])
}

// ─── Submit ───────────────────────────────────────────────────────────────────
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    let imageUrl: string | null = campaign.value!.image_url

    // Nueva imagen seleccionada → subir y borrar la vieja
    if (imageFile.value) {
      if (imageUrl) await deleteOldImage(imageUrl)
      imageUrl = await uploadImage(imageFile.value)
    }

    // Usuario quitó la imagen sin reemplazarla
    if (removeExistingImage.value && !imageFile.value) {
      if (imageUrl) await deleteOldImage(imageUrl)
      imageUrl = null
    }

    const { error } = await supabase
      .from('campaigns')
      .update({
        title:       state.title,
        system:      state.system,
        description: state.description,
        play_mode:   state.play_mode,
        contact:     state.contact,
        project_id:  state.project_id,
        image_url:   imageUrl,
        user_id:     user.value!.sub
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    toast.add({ title: '¡Campaña actualizada!', color: 'success' })
    router.push(`/campaigns/${id}`)
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-2xl mx-auto space-y-8">

      <!-- Encabezado -->
      <div class="flex items-center gap-4">
        <UButton
          :to="`/campaigns/${id}`"
          icon="i-lucide-chevron-left"
          variant="outline"
          color="neutral"
          size="xl"
          class="rounded-full"
        />
        <div>
          <h1 class="text-2xl font-bold text-white">Editar campaña</h1>
          <p class="text-sm text-gray-400">{{ campaign?.title }}</p>
        </div>
      </div>

      <!-- Form -->
      <UForm
        :schema="campaignSchema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Título -->
        <UFormField label="Título de la campaña" name="title" required>
          <UInput v-model="state.title" size="lg" class="w-full" />
        </UFormField>

        <!-- Sistema -->
        <UFormField label="Sistema de juego" name="system" required>
          <UInput v-model="state.system" size="lg" class="w-full" />
        </UFormField>

        <!-- Descripción -->
        <UFormField label="Descripción / Trama" name="description" required>
          <UTextarea v-model="state.description" :rows="4" size="lg" class="w-full" />
        </UFormField>

        <!-- Modo de juego -->
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

        <!-- Proyecto -->
        <UFormField label="Proyecto" name="project_id" required>
          <USelectMenu
            v-model="state.project_id"
            :items="projectOptions"
            value-key="value"
            label-key="label"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Contacto -->
        <UFormField label="Contacto" name="contact" required>
          <UInput v-model="state.contact" size="lg" class="w-full" />
        </UFormField>

        <!-- Imagen -->
        <UFormField label="Imagen de portada" name="image">
          <div class="space-y-3">
            <!-- Preview -->
            <div
              v-if="imagePreview"
              class="relative w-full rounded-xl overflow-hidden border border-gray-700"
              style="max-height: 220px;"
            >
              <img
                :src="imagePreview"
                alt="Preview"
                class="w-full object-cover"
                style="max-height: 220px;"
              />
              <UButton
                icon="i-lucide-x"
                color="error"
                variant="solid"
                size="xs"
                class="absolute top-2 right-2"
                @click="onRemoveImage"
              />
            </div>

            <!-- Drop zone -->
            <div
              v-else
              class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 p-8 cursor-pointer hover:border-primary-400 transition-colors"
              @click="fileInputRef?.click()"
            >
              <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-500" />
              <p class="text-sm text-gray-500">Haz clic para subir una imagen</p>
              <p class="text-xs text-gray-600">PNG, JPG, WEBP · máx. 5 MB</p>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />
          </div>
        </UFormField>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 pt-2">
          <UButton
            :to="`/campaigns/${id}`"
            variant="ghost"
            label="Cancelar"
          />
          <UButton
            type="submit"
            size="lg"
            :loading="loading"
            icon="i-lucide-save"
            label="Guardar cambios"
          />
        </div>
      </UForm>

    </div>
  </div>
</template>