<script setup lang="ts">
// ─── Schema ───────────────────────────────────────────────────────────────────
import { campaignSchema } from '@/schemas/campaign'
import type { CampaignForm } from '@/schemas/campaign';

// ─── Estado ───────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient();
const toast = useToast();

const loading = ref(false);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Proyectos disponibles (ajusta la query a tu estructura)
const { data: projects } = await useAsyncData("projects", async () => {
  const { data } = await supabase.from("projects").select("id, name");
  return data ?? [];
});

const projectOptions = computed(() =>
  (projects.value ?? []).map((p: any) => ({ label: p.name, value: p.id })),
);

const playModeOptions = [
  { label: "Remoto", value: "remote" },
  { label: "Presencial", value: "in_person" },
  { label: "Híbrido", value: "hybrid" },
];

// Estado inicial del formulario
const state = reactive<Partial<CampaignForm>>({
  title: "",
  system: "",
  description: "",
  play_mode: "remote",
  contact: "",
  project_id: undefined,
  image: undefined,
});

// ─── Manejo de imagen ─────────────────────────────────────────────────────────
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.add({
      title: "Archivo inválido",
      description: "Solo se permiten imágenes.",
      color: "error",
    });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "Imagen muy grande",
      description: "El límite es 5 MB.",
      color: "error",
    });
    return;
  }

  imageFile.value = file;
  state.image = file;
  imagePreview.value = URL.createObjectURL(file);
}

function removeImage() {
  imageFile.value = null;
  imagePreview.value = null;
  state.image = undefined;
  if (fileInputRef.value) fileInputRef.value.value = "";
}

// ─── Subida de imagen a Supabase Storage ──────────────────────────────────────
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
  loading.value = true;
  try {
    let imageUrl: string | null = null;

    if (imageFile.value) {
      imageUrl = await uploadImage(imageFile.value);
    }

    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      title: state.title,
      system: state.system,
      description: state.description,
      play_mode: state.play_mode,
      contact: state.contact,
      project_id: state.project_id,
      image_url: imageUrl,
      user_id: user?.id,
    };

    const { error } = await supabase.from("campaigns").insert(payload);
    if (error) throw new Error(error.message);

    toast.add({
      title: "¡Campaña creada!",
      description: `"${state.title}" fue guardada exitosamente.`,
      color: "success",
    });

    // Resetear form
    Object.assign(state, {
      title: "",
      system: "",
      description: "",
      play_mode: "remote",
      contact: "",
      project_id: undefined,
      image: undefined,
    });
    removeImage();
  } catch (err: any) {
    toast.add({ title: "Error", description: err.message, color: "error" });
  } finally {
    loading.value = false;

    return navigateTo('/')
  }
}
</script>

<template>
  <UForm
    :schema="campaignSchema"
    :state="state"
    class="space-y-6"
    @submit="onSubmit"
  >
    <!-- Título -->
    <UFormField label="Título de la campaña" name="title" required>
      <UInput
        v-model="state.title"
        placeholder="Ej: La Sombra de Uldra"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Sistema -->
    <UFormField label="Sistema de juego" name="system" required>
      <UInput
        v-model="state.system"
        placeholder="Ej: Fabula Ultima, D&D 5e, Pathfinder…"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Descripción -->
    <UFormField label="Descripción / Trama" name="description" required>
      <UTextarea
        v-model="state.description"
        placeholder="Cuéntale a los jugadores de qué va la campaña…"
        :rows="4"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Modo de juego -->
    <UFormField label="Modo de juego" name="play_mode" required>
      <USelectMenu
        v-model="state.play_mode"
        :items="playModeOptions"
        value-key="value"
        label-key="label"
        placeholder="Selecciona un modo"
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
        placeholder="Selecciona un proyecto"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Contacto -->
    <UFormField label="Contacto" name="contact" required>
      <UInput
        v-model="state.contact"
        placeholder="Ej: Discord @usuario, email, WhatsApp…"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Imagen -->
    <UFormField label="Imagen de portada" name="image">
      <div class="space-y-3">
        <!-- Preview -->
        <div
          v-if="imagePreview"
          class="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
          style="max-height: 220px"
        >
          <img
            :src="imagePreview"
            alt="Preview"
            class="w-full object-cover"
            style="max-height: 220px"
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

        <!-- Drop zone / botón -->
        <div
          v-else
          class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 cursor-pointer hover:border-primary-400 transition-colors"
          @click="fileInputRef?.click()"
        >
          <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Haz clic para subir una imagen
          </p>
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

    <!-- Submit -->
    <div class="flex justify-end pt-2">
      <UButton
        type="submit"
        size="lg"
        :loading="loading"
        icon="i-lucide-save"
        label="Crear campaña"
      />
    </div>
  </UForm>
</template>
