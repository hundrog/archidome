<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from "#imports";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  title: string;
  system: string;
  description: string;
  play_mode: "remote" | "in_person" | "hybrid";
  contact: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  projects: { name: string } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const playModeConfig = {
  remote: { label: "Remoto", icon: "i-lucide-monitor", color: "info" },
  in_person: { label: "Presencial", icon: "i-lucide-users", color: "success" },
  hybrid: { label: "Híbrido", icon: "i-lucide-shuffle", color: "warning" },
} as const;

// ─── Setup ────────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const id = route.params.id as string;

// ─── Fetch ────────────────────────────────────────────────────────────────────
const { data: campaign, pending } = await useAsyncData(
  `campaign-${id}`,
  async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, projects(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Campaign;
  },
);

// 404 si no existe
if (!campaign.value) {
  throw createError({ statusCode: 404, message: "Campaña no encontrada" });
}

// ─── ¿Es el dueño? ────────────────────────────────────────────────────────────
const isOwner = computed(
  () => !!user.value && user.value.sub === campaign.value?.user_id,
);

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const deleting = ref(false);

async function deleteCampaign() {
  deleting.value = true;
  try {
    // Eliminar imagen del bucket si existe
    if (campaign.value?.image_url) {
      const path = campaign.value.image_url.split("/campaign-images/")[1];
      if (path) {
        await supabase.storage.from("campaign-images").remove([path]);
      }
    }

    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) throw error;

    toast.add({ title: "Campaña eliminada", color: "success" });
    router.push("/campaigns");
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err.message,
      color: "error",
    });
  } finally {
    deleting.value = false;
    showDeleteModal.value = false;
  }
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => campaign.value?.title ?? "Campaña",
  description: () => campaign.value?.description ?? "",
  ogImage: () => campaign.value?.image_url ?? undefined,
});

// protected image URL (solo https y de tu bucket):
const safeImageUrl = computed(() => {
  const url = campaign.value?.image_url
  if (!url) return null
  // Solo permite URLs de tu bucket de Supabase y https en general
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? url : null
  } catch {
    return null
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- ── Loading ── -->
    <div
      v-if="pending"
      class="max-w-4xl mx-auto px-4 py-12 space-y-6 animate-pulse"
    >
      <div class="h-72 rounded-2xl bg-gray-800" />
      <div class="h-8 bg-gray-800 rounded w-2/3" />
      <div class="h-4 bg-gray-800 rounded w-1/3" />
      <div class="space-y-2 pt-4">
        <div class="h-3 bg-gray-800 rounded w-full" />
        <div class="h-3 bg-gray-800 rounded w-5/6" />
        <div class="h-3 bg-gray-800 rounded w-4/6" />
      </div>
    </div>

    <template v-else-if="campaign">
      <!-- ── Hero imagen ── -->
      <div class="relative w-full h-72 sm:h-96 overflow-hidden bg-gray-900">
        <img
          v-if="safeImageUrl"
          :src="safeImageUrl"
          :alt="campaign.title"
          class="w-full h-full object-cover"
        />
        <div
          class="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/40 to-transparent"
        />

        <!-- Botón volver -->
        <div class="absolute top-4 left-4 lg:top-12 lg:left-12">
          <UButton
            icon="i-lucide-chevron-left"
            to="/campaigns"
            size="xl"
            color="neutral"
            variant="subtle"
            class="rounded-full z-10"
          />
        </div>

        <!-- Acciones dueño -->
        <div v-if="isOwner" class="absolute top-4 right-4 lg:top-12 lg:right-12 flex gap-2">
          <UButton
            :to="`/campaigns/${id}/edit`"
            icon="i-lucide-pencil"
            size="xl"
            variant="solid"
            color="neutral"
            class="rounded-full z-10"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xl"
            variant="solid"
            color="error"
            class="rounded-full z-10"
            @click="showDeleteModal = true"
          />
        </div>
      </div>

      <!-- ── Contenido ── -->
      <div class="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <!-- Título + badges -->
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2 items-center">
            <UBadge
              :color="playModeConfig[campaign.play_mode].color"
              variant="solid"
              :label="playModeConfig[campaign.play_mode].label"
            >
              <template #leading>
                <UIcon
                  :name="playModeConfig[campaign.play_mode].icon"
                  class="size-3"
                />
              </template>
            </UBadge>
            <UBadge
              v-if="campaign.projects?.name"
              color="neutral"
              variant="subtle"
              :label="campaign.projects.name"
            >
              <template #leading>
                <UIcon name="i-lucide-folder" class="size-3" />
              </template>
            </UBadge>
          </div>

          <h1 class="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {{ campaign.title }}
          </h1>

          <p
            class="text-primary-400 font-medium uppercase tracking-widest text-sm"
          >
            {{ campaign.system }}
          </p>
        </div>

        <USeparator />

        <!-- Descripción -->
        <div class="space-y-2">
          <h2
            class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
          >
            Descripción
          </h2>
          <p class="text-gray-300 leading-relaxed whitespace-pre-line">
            {{ campaign.description }}
          </p>
        </div>

        <USeparator />

        <!-- Contacto -->
        <div class="space-y-2">
          <h2
            class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
          >
            ¿Cómo unirme?
          </h2>
          <div
            class="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
          >
            <UIcon
              name="i-lucide-message-circle"
              class="size-5 text-primary-400 shrink-0"
            />
            <span class="text-gray-200">{{ campaign.contact }}</span>
          </div>
        </div>

        <!-- Fecha -->
        <p class="text-xs text-gray-600 pt-2">
          Publicada el
          {{
            new Date(campaign.created_at).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }}
        </p>
      </div>
    </template>

    <!-- ── Modal confirmar eliminar ── -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-full bg-red-500/10">
              <UIcon
                name="i-lucide-triangle-alert"
                class="size-5 text-red-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-white">Eliminar campaña</h3>
          </div>
          <p class="text-gray-400 text-sm">
            ¿Estás seguro de que quieres eliminar
            <span class="text-white font-medium">{{ campaign?.title }}</span
            >? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              variant="ghost"
              label="Cancelar"
              @click="showDeleteModal = false"
            />
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              label="Eliminar"
              :loading="deleting"
              @click="deleteCampaign"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
