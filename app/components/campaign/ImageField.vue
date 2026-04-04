<script setup lang="ts">
// components/campaign/ImageField.vue

// ─── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  initialUrl?: string | null
}>()

const emit = defineEmits<{
  update: [payload: { file: File | null; removed: boolean }]
}>()

// ─── Setup ────────────────────────────────────────────────────────────────────
const toast        = useToast()
const fileInputRef = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(props.initialUrl ?? null)
const imageFile    = ref<File | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  imagePreview.value = URL.createObjectURL(file)
  emit('update', { file, removed: false })
}

function removeImage() {
  imageFile.value    = null
  imagePreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  emit('update', { file: null, removed: true })
}

// Limpiar object URL al desmontar para evitar memory leaks
onUnmounted(() => {
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
})
</script>

<template>
  <UFormField label="Imagen de portada" name="image">
    <div class="space-y-3">

      <!-- Preview -->
      <div
        v-if="imagePreview"
        class="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
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
          @click="removeImage"
        />
      </div>

      <!-- Dropzone -->
      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
               border-gray-300 dark:border-gray-600 p-8 cursor-pointer
               hover:border-primary-400 transition-colors"
        @click="fileInputRef?.click()"
      >
        <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-400" />
        <p class="text-sm text-gray-500 dark:text-gray-400">Haz clic para subir una imagen</p>
        <p class="text-xs text-gray-400">PNG, JPG, WEBP · máx. 5 MB</p>
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
</template>