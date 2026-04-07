<!-- pages/campaigns/new.vue -->
<script setup lang="ts">
import { hookSchema, portalSchema, rulesSchema } from "@/schemas/campaign";
import { z } from "zod";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const router = useRouter();

// ─── Estado del formulario ────────────────────────────────────────────────────
const campaignStore = useCampaignStore();

// Reset form when mounting to clear any previous campaign data
onMounted(() => {
  campaignStore.resetForm();
});

// ─── Imagen ───────────────────────────────────────────────────────────────────

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const currentTab = ref("0");

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

// ─── Subida de imagen ─────────────────────────────────────────────────────────

// ─── Submit ───────────────────────────────────────────────────────────────────
const loading = ref(false);

async function onSubmit() {
  if (!validateCurrentTab()) return;
  loading.value = true;

  try {
    let imageUrl: string | null = null;
    if (campaignStore.imageFile)
      imageUrl = await campaignStore.uploadImage(campaignStore.imageFile);

    const payload = {
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
      user_id: user.value!.sub,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    toast.add({
      title: "¡Campaña creada!",
      description: `"${campaignStore.form.title}" fue publicada.`,
      color: "success",
    });
    campaignStore.resetForm();
    router.push(`/campaigns/${data.id}`);
  } catch (err: any) {
    toast.add({ title: "Error", description: err.message, color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <!-- ── Encabezado ── -->
      <div>
        <NuxtLink
          to="/campaigns"
          class="inline-flex items-center gap-2 font-body text-label-xl text-on-surface-dim hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver a campañas
        </NuxtLink>
        <h1 class="font-display text-display-sm text-on-surface">
          Forge Your Tale
        </h1>
        <p class="font-body text-body-sm text-on-surface-dim mt-1">
          Los reinos esperan. Define el camino y convoca a los héroes.
        </p>
      </div>

      <!-- ── Tabs ── -->
      <UTabs v-model="currentTab" :items="tabs"">
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
          icon="i-lucide-sparkles"
          trailing
          label="Manifest Adventure"
          class="gradient-primary rounded-full text-white"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </div>
  </div>
</template>
