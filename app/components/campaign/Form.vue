<script setup lang="ts">
import { useSupabaseClient } from "#imports";
import { campaignSchema } from "~/schemas/campaign";
import type { Database } from "@/types/database.types";
import type { CampaignForm } from "~/schemas/campaign";
import { useCampaignStore } from "~/stores/campaign";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];

const props = defineProps<{ campaignId?: string }>();
const router = useRouter();
const toast = useToast();
const supabase = useSupabaseClient();
const store = useCampaignStore();

const playModeOptions = [
  { label: "Remoto", value: "remote" },
  { label: "Presencial", value: "in_person" },
  { label: "Híbrido", value: "hybrid" },
];

const projectOptions = computed(() => store.projectOptions);

const showLocation = computed(() => store.showLocation);

// Initialize projects if not already loaded
onMounted(async () => {
  if (props.campaignId) {
    await store.fetchCampaignById(props.campaignId);
    store.setEditMode(props.campaignId);

    if (store.currentCampaign) {
      const campaign = store.currentCampaign;
      store.setFormField("title", campaign.title);
      store.setFormField("system", campaign.system);
      store.setFormField("description", campaign.description);
      store.setFormField("play_mode", campaign.play_mode);
      store.setFormField("contact", campaign.contact);
      store.setFormField("project_id", campaign.project_id);
      store.setFormField("location_name", campaign.location_name ?? "");
      store.setLocation(
        campaign.location_name ?? "",
        campaign.lat && campaign.lng
          ? { lat: campaign.lat, lng: campaign.lng }
          : null,
      );

      if (campaign.image_url) {
        store.existingImageUrl = campaign.image_url;
        store.imagePreview = campaign.image_url;
      }
    }
  }

  if (store.projects.length === 0) {
    await store.fetchProjects();
  }
});

// Reset location if play mode changes
watch(
  () => store.form.play_mode,
  (mode) => {
    if (mode === "remote") {
      store.setLocation("", null);
    }
  },
);

// Watch form.play_mode to update local computed
watch(
  () => store.form.play_mode,
  (mode) => {
    if (!mode) store.setFormField("play_mode", "remote");
  },
  { immediate: true },
);

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

  store.setImage(file);
}

function removeImage() {
  store.removeImage();
}

async function onSubmit() {
  try {
    let imageUrl: string | null = store.isEditMode
      ? store.existingImageUrl
      : null;

    // Si se marcó para eliminar la imagen existente, eliminarla
    if (store.shouldDeleteExistingImage && store.existingImageUrl) {
      await store.deleteImageFromBucket(store.existingImageUrl);
      imageUrl = null;
    }

    // Si hay nueva imagen, subirla (después de eliminar la anterior)
    if (store.imageFile) {
      imageUrl = await store.uploadImage(store.imageFile);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload: CampaignInsert = {
      title: store.form.title!,
      system: store.form.system!,
      description: store.form.description!,
      play_mode: store.form.play_mode!,
      contact: store.form.contact!,
      project_id: store.form.project_id!,
      image_url: imageUrl,
      user_id: user!.id,
      location_name: showLocation.value
        ? (store.form.location_name ?? null)
        : null,
      lat: showLocation.value ? (store.resolvedCoords?.lat ?? null) : null,
      lng: showLocation.value ? (store.resolvedCoords?.lng ?? null) : null,
    };

    if (store.isEditMode && props.campaignId) {
      await store.updateCampaign(props.campaignId, payload);
    } else {
      await store.createCampaign(payload);
    }

    const successTitle = store.isEditMode
      ? "¡Campaña actualizada!"
      : "¡Campaña creada!";
    const successDescription = store.isEditMode
      ? `"${store.form.title}" fue actualizada.`
      : `"${store.form.title}" fue guardada.`;

    toast.add({
      title: successTitle,
      description: successDescription,
      color: "success",
    });

    // Navigate after successful save
    if (store.isEditMode && props.campaignId) {
      await router.push(`/campaigns/${props.campaignId}`);
    } else {
      await router.push("/campaigns");
    }
  } catch (err: any) {
    toast.add({ title: "Error", description: err.message, color: "error" });
  }
}
</script>

<template>
  <UForm
    :schema="campaignSchema"
    :state="store.form"
    class="space-y-6"
    @submit="onSubmit"
  >
    <UFormField label="Título de la campaña" name="title" required>
      <UInput
        :model-value="store.form.title"
        placeholder="Ej: La Sombra de Uldra"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('title', val)"
      />
    </UFormField>

    <UFormField label="Sistema de juego" name="system" required>
      <UInput
        :model-value="store.form.system"
        placeholder="Ej: Fabula Ultima, D&D 5e…"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('system', val)"
      />
    </UFormField>

    <UFormField label="Descripción / Trama" name="description" required>
      <UTextarea
        :model-value="store.form.description"
        placeholder="Cuéntale a los jugadores de qué va la campaña…"
        :rows="4"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('description', val)"
      />
    </UFormField>

    <UFormField label="Modo de juego" name="play_mode" required>
      <USelectMenu
        :model-value="store.form.play_mode"
        :items="playModeOptions"
        value-key="value"
        label-key="label"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('play_mode', val)"
      />
    </UFormField>

    <!-- Ubicación: solo para presencial e híbrido -->
    <Transition name="fade">
      <CampaignLocationField
        v-if="showLocation"
        :initial-location="store.form.location_name"
        :initial-coords="store.resolvedCoords"
        @update="
          ({ lat, lng, locationName }) => {
            store.setLocation(
              locationName,
              lat != null && lng != null ? { lat, lng } : null,
            );
          }
        "
      />
    </Transition>

    <UFormField label="Proyecto" name="project_id" required>
      <USelectMenu
        :model-value="store.form.project_id"
        :items="projectOptions"
        value-key="value"
        label-key="label"
        placeholder="Selecciona un proyecto"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('project_id', val)"
      />
    </UFormField>

    <UFormField label="Contacto" name="contact" required>
      <UInput
        :model-value="store.form.contact"
        placeholder="Ej: Discord @usuario, email…"
        size="lg"
        class="w-full"
        @update:model-value="(val) => store.setFormField('contact', val)"
      />
    </UFormField>

    <!-- Imagen -->
    <CampaignImageField
      :initial-url="store.existingImageUrl"
      @update="
        ({ file, removed }) => {
          if (removed) {
            store.removeImage();
          } else if (file) {
            store.setImage(file);
          }
        }
      "
    />

    <div class="flex justify-end pt-2">
      <UButton
        type="submit"
        size="lg"
        icon="i-lucide-save"
        :loading="store.loading || store.uploading"
        :label="store.isEditMode ? 'Guardar cambios' : 'Crear campaña'"
      />
    </div>
  </UForm>
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
