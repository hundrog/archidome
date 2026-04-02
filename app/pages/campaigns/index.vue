<script setup lang="ts">
import { useSupabaseClient } from "#imports";

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
}

// ─── Config ───────────────────────────────────────────────────────────────────
const playModeConfig = {
  remote: { label: "Remoto", icon: "i-lucide-monitor", color: "info" },
  in_person: { label: "Presencial", icon: "i-lucide-users", color: "success" },
  hybrid: { label: "Híbrido", icon: "i-lucide-shuffle", color: "warning" },
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient();
const search = ref("");
const modeFilter = ref<string | null>(null);
const user = useSupabaseUser();

const modeFilterOptions = [
  { label: "Todos", value: null },
  { label: "Remoto", value: "remote" },
  { label: "Presencial", value: "in_person" },
  { label: "Híbrido", value: "hybrid" },
];

const {
  data: campaigns,
  pending,
  refresh,
} = await useAsyncData("campaigns", async () => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Campaign[];
});

// ─── Filtrado local ───────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = campaigns.value ?? [];

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.system.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }

  if (modeFilter.value) {
    list = list.filter((c) => c.play_mode === modeFilter.value);
  }

  return list;
});

// ─── Fallback imagen ──────────────────────────────────────────────────────────
const PLACEHOLDER =
  "https://placehold.co/600x340/1a1a2e/e2c97e?text=Sin+imagen";

function imgSrc(url: string | null) {
  return url ?? PLACEHOLDER;
}
</script>

<template>
  <div class="">
    <!-- ── Encabezado ── -->
    <div class="flex justify-between items-center mb-6 max-w-7xl mx-auto">
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-white mb-1">
          Campañas
        </h1>
        <p class="text-gray-400 text-sm">Encuentra tu próxima aventura</p>
      </div>
      <UButton
        icon="i-lucide-plus"
        to="/campaigns/new"
        size="xl"
        color="primary"
        variant="subtle"
        class="rounded-full z-10"
        v-if="user"
      />
    </div>

    <!-- ── Filtros ── -->
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 mb-8">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Buscar por título, sistema…"
        size="lg"
        class="flex-1"
      />
      <USelectMenu
        v-model="modeFilter"
        :items="modeFilterOptions"
        value-key="value"
        label-key="label"
        placeholder="Modo de juego"
        size="lg"
        class="w-full sm:w-48"
      />
    </div>

    <!-- ── Loading ── -->
    <div
      v-if="pending"
      class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-2xl overflow-hidden bg-gray-900 animate-pulse"
      >
        <div class="h-48 bg-gray-800" />
        <div class="p-5 space-y-3">
          <div class="h-4 bg-gray-800 rounded w-3/4" />
          <div class="h-3 bg-gray-800 rounded w-1/2" />
          <div class="h-3 bg-gray-800 rounded w-full" />
          <div class="h-3 bg-gray-800 rounded w-5/6" />
        </div>
      </div>
    </div>

    <!-- ── Grid de cards ── -->
    <div
      v-else-if="filtered.length"
      class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <NuxtLink
        v-for="campaign in filtered"
        :key="campaign.id"
        :to="`/campaigns/${campaign.id}`"
        class="group rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 flex flex-col"
      >
        <!-- Imagen -->
        <div class="relative h-48 overflow-hidden bg-gray-800 shrink-0">
          <img
            :src="imgSrc(campaign.image_url)"
            :alt="campaign.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <!-- Badge modo de juego -->
          <div class="absolute top-3 right-3">
            <UBadge
              :color="playModeConfig[campaign.play_mode].color"
              variant="solid"
              size="sm"
              :label="playModeConfig[campaign.play_mode].label"
            >
              <template #leading>
                <UIcon
                  :name="playModeConfig[campaign.play_mode].icon"
                  class="size-3"
                />
              </template>
            </UBadge>
          </div>
        </div>

        <!-- Contenido -->
        <div class="p-5 flex flex-col flex-1 gap-3">
          <!-- Título y sistema -->
          <div>
            <h2
              class="text-lg font-semibold text-white leading-snug line-clamp-1 group-hover:text-primary-400 transition-colors"
            >
              {{ campaign.title }}
            </h2>
            <p
              class="text-xs text-primary-400 font-medium mt-0.5 uppercase tracking-wide"
            >
              {{ campaign.system }}
            </p>
          </div>

          <!-- Descripción -->
          <p class="text-sm text-gray-400 line-clamp-3 flex-1">
            {{ campaign.description }}
          </p>

          <!-- Footer -->
          <div
            class="flex items-center gap-2 pt-2 border-t border-gray-800 mt-auto"
          >
            <UIcon
              name="i-lucide-message-circle"
              class="size-4 text-gray-500 shrink-0"
            />
            <span class="text-xs text-gray-500 truncate">{{
              campaign.contact
            }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- ── Empty state ── -->
    <div
      v-else
      class="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 gap-4 text-center"
    >
      <UIcon name="i-lucide-scroll" class="size-14 text-gray-700" />
      <p class="text-gray-400 text-lg font-medium">No hay campañas todavía</p>
      <p class="text-gray-600 text-sm">
        {{
          search || modeFilter
            ? "Intenta con otros filtros"
            : "Sé el primero en crear una"
        }}
      </p>
      <UButton
        v-if="!search && !modeFilter"
        to="/campaigns/new"
        icon="i-lucide-plus"
        label="Crear campaña"
        size="lg"
      />
      <UButton
        v-else
        variant="ghost"
        icon="i-lucide-x"
        label="Limpiar filtros"
        @click="
          search = '';
          modeFilter = null;
        "
      />
    </div>
  </div>
</template>
