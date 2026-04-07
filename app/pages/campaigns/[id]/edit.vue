<script setup lang="ts">
import { hookSchema, portalSchema, rulesSchema } from "@/schemas/campaign";
import { z } from "zod";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const toast = useToast();

// ─── Estado del formulario ────────────────────────────────────────────────────
const campaignStore = useCampaignStore();

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const currentTab = ref("0");
const loading = ref(false);
const initialLoading = ref(true);

const tabs = [
  { label: "01 Hook", slot: "hook", icon: "i-lucide-book-open" },
  { label: "02 Portal", slot: "portal", icon: "i-lucide-compass" },
  { label: "03 Rules", slot: "rules", icon: "i-lucide-scroll" },
  { label: "04 House", slot: "house", icon: "i-lucide-home" },
];

// Validación por tab antes de avanzar
function validateCurrentTab(): boolean {
  try {
    if (currentTab.value === "0") {
      hookSchema.parse(campaignStore.form);
    } else if (currentTab.value === "1") {
      portalSchema.parse(campaignStore.form);
    } else if (currentTab.value === "2") {
      rulesSchema.parse(campaignStore.form);
    } else if (currentTab.value === "3") {
      if (!campaignStore.form.project_id) {
        toast.add({
          title: "Faltan datos",
          description: "Selecciona un proyecto",
          color: "warning",
        });
        return false;
      }
    }
    return true;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issue = err.issues[0];
      toast.add({
        title: "Faltan datos",
        description: issue?.message,
        color: "warning",
      });
    }
    return false;
  }
}

function nextTab() {
  if (!validateCurrentTab()) return;

  const idx = parseInt(currentTab.value, 10);
  if (idx !== -1 && idx < tabs.length - 1) {
    currentTab.value = (idx + 1).toString();
  }
}

function prevTab() {
  const idx = parseInt(currentTab.value, 10);
  if (idx !== -1 && idx > 0) {
    currentTab.value = (idx - 1).toString();
  }
}

const isLastTab = computed(() => currentTab.value === "3");
const isFirstTab = computed(() => currentTab.value === "0");

// ─── Load campaign data ────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await campaignStore.fetchCampaignById(id);
    
    if (campaignStore.currentCampaign) {
      const campaign = campaignStore.currentCampaign;
      campaignStore.form.title = campaign.title;
      campaignStore.form.system = campaign.system;
      campaignStore.form.hook = campaign.hook ?? "";
      campaignStore.form.description = campaign.description ?? "";
      campaignStore.form.play_mode = campaign.play_mode ?? "remote";
      campaignStore.form.virtual_platform = campaign.virtual_platform ?? undefined;
      campaignStore.form.frequency = campaign.frequency ?? undefined;
      campaignStore.form.language = campaign.language ?? "Español";
      campaignStore.form.timezone = campaign.timezone ?? undefined;
      campaignStore.form.duration = campaign.duration ?? undefined;
      campaignStore.form.location_name = campaign.location_name ?? undefined;
      campaignStore.form.lat = campaign.lat;
      campaignStore.form.lng = campaign.lng;
      campaignStore.form.max_players = campaign.max_players ?? 4;
      campaignStore.form.current_players = campaign.current_players ?? 4;
      campaignStore.form.start_level = campaign.start_level ?? 1;
      campaignStore.form.style_tags = campaign.style_tags ?? [];
      campaignStore.form.house_rules = (campaign.house_rules as any) ?? [];
      campaignStore.form.project_id = campaign.project_id;
      campaignStore.existingImageUrl = campaign.image_url;
    }
  } catch (err: any) {
    console.error("Error loading campaign:", err);
    toast.add({
      title: "Error",
      description: "No se pudo cargar la campaña",
      color: "error",
    });
    router.push("/campaigns");
  } finally {
    initialLoading.value = false;
  }
});

// ─── Submit ───────────────────────────────────────────────────────────────────
async function onSubmit() {
  if (!validateCurrentTab()) return;
  loading.value = true;

  try {
    let imageUrl: string | null = campaignStore.existingImageUrl ?? null;
    
    if (campaignStore.imageFile) {
      imageUrl = await campaignStore.uploadImage(campaignStore.imageFile);
    } else if (campaignStore.shouldDeleteExistingImage && campaignStore.existingImageUrl) {
      await campaignStore.deleteImageFromBucket(campaignStore.existingImageUrl);
      imageUrl = null;
    }

    const payload: any = {
      title: campaignStore.form.title || "",
      system: campaignStore.form.system || "",
      hook: campaignStore.form.hook || "",
      description: campaignStore.form.description || "",
      play_mode: campaignStore.form.play_mode || "remote",
      virtual_platform: campaignStore.form.virtual_platform,
      frequency: campaignStore.form.frequency,
      language: campaignStore.form.language,
      timezone: campaignStore.form.timezone,
      duration: campaignStore.form.duration,
      location_name: campaignStore.form.location_name,
      lat: campaignStore.form.lat,
      lng: campaignStore.form.lng,
      max_players: campaignStore.form.max_players || 4,
      current_players: campaignStore.form.current_players || 0,
      start_level: campaignStore.form.start_level || 1,
      style_tags: campaignStore.form.style_tags || [],
      house_rules: campaignStore.form.house_rules || [],
      project_id: campaignStore.form.project_id || "",
      image_url: imageUrl,
    };

    await campaignStore.updateCampaign(id, payload as any);

    toast.add({
      title: "¡Campaña actualizada!",
      description: `"${campaignStore.form.title}" fue guardada.`,
      color: "success",
    });
    
    router.push(`/campaigns/${id}`);
  } catch (err: any) {
    toast.add({ title: "Error", description: err.message, color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div v-if="initialLoading" class="min-h-screen bg-surface flex items-center justify-center">
    <UIcon name="i-lucide-loader" class="animate-spin size-8 text-primary" />
  </div>

  <div v-else class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <!-- ── Encabezado ── -->
      <div>
        <NuxtLink
          :to="`/campaigns/${id}`"
          class="inline-flex items-center gap-2 font-body text-label-sm text-on-surface-dim hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver a campaña
        </NuxtLink>
        <h1 class="font-display text-display-sm text-on-surface">
          Editar Campaña
        </h1>
        <p class="font-body text-body-sm text-on-surface-dim mt-1">
          Realiza cambios en tu aventura
        </p>
      </div>

      <!-- ── Tabs ── -->
      <UTabs v-model="currentTab" :items="tabs">
        <!-- Hook -->
        <template #hook>
          <div class="pt-8">
            <CampaignFormStepHook />
          </div>
        </template>

        <!-- Portal -->
        <template #portal>
          <div class="pt-8">
            <CampaignFormStepPortal />
          </div>
        </template>

        <!-- Rules -->
        <template #rules>
          <div class="pt-8">
            <CampaignFormStepRules />
          </div>
        </template>

        <!-- House -->
        <template #house>
          <div class="pt-8">
            <CampaignFormStepHouse />
          </div>
        </template>
      </UTabs>

      <!-- ── Navegación ── -->
      <div
        class="flex items-center justify-between pt-4 border-t border-outline-variant/20"
      >
        <UButton
          v-if="!isFirstTab"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Anterior"
          class="rounded-full"
          @click="prevTab"
        />
        <div v-else />

        <UButton
          v-if="!isLastTab"
          icon="i-lucide-arrow-right"
          trailing
          label="Siguiente"
          class="gradient-primary rounded-full text-white"
          @click="nextTab"
        />
        <UButton
          v-else
          icon="i-lucide-check"
          trailing
          label="Guardar cambios"
          class="gradient-primary rounded-full text-white"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </div>
  </div>
</template>
