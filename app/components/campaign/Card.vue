<script setup lang="ts">
// components/campaign/Card.vue
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & {
  profiles?: Pick<ProfileRow, "full_name" | "username" | "avatar_url">;
};

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  campaign: Campaign;
  distance?: string | null;
}>();

// ─── Config ───────────────────────────────────────────────────────────────────
const playModeConfig = {
  remote: {
    label: "Remoto",
    icon: "i-lucide-monitor",
    color: "bg-primary/60 text-surface",
  },
  in_person: {
    label: "Presencial",
    icon: "i-lucide-users",
    color: "bg-secondary/60 text-surface",
  },
  hybrid: {
    label: "Híbrido",
    icon: "i-lucide-shuffle",
    color: "bg-tertiary/60 text-surface",
  },
} as const;

const mode = computed(() => playModeConfig[props.campaign.play_mode]);

const PLACEHOLDER =
  "https://placehold.co/600x340/1e174a/9fa7ff?text=Sin+imagen";
</script>

<template>
  <NuxtLink
    :to="`/campaigns/${campaign.id}`"
    class="card group flex flex-col overflow-hidden card-hoverable"
  >
    <!-- ── Imagen ── -->
    <div class="relative h-48 overflow-hidden shrink-0">
      <img
        :src="campaign.image_url ?? PLACEHOLDER"
        :alt="campaign.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Overlay gradiente -->
      <div
        class="absolute inset-0 bg-linear-to-t from-surface-high via-surface-high/20 to-transparent"
      />

      <!-- Badges top -->
      <div class="absolute top-3 right-3 flex flex-col items-end gap-1.5">
        <!-- Modo de juego -->
        <span
          class="label-metadata flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-sm"
          :class="mode.color"
        >
          <UIcon :name="mode.icon" class="size-3" />
          {{ mode.label }}
        </span>

        <!-- Distancia -->
        <span
          v-if="distance"
          class="label-metadata flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-variant/80 text-on-surface-dim backdrop-blur-sm"
        >
          <UIcon name="i-lucide-map-pin" class="size-3" />
          {{ distance }}
        </span>
      </div>
    </div>

    <!-- ── Contenido ── -->
    <div class="flex flex-col flex-1 p-5 gap-3">
      <!-- Sistema -->
      <span class="label-metadata text-primary">
        {{ campaign.system }}
      </span>
      <span class="label-metadata text-secondary items-center gap-1.5 flex">
        <UIcon
          name="i-lucide-users"
          class="size-3 text-on-surface-dim shrink-0"
        />
        {{ campaign.current_players }} / {{ campaign.max_players }}
      </span>

      <!-- Título -->
      <h2
        class="font-display text-headline-sm text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200"
      >
        {{ campaign.title }}
      </h2>

      <!-- Descripción -->
      <p class="font-body text-body-sm text-on-surface-dim line-clamp-3 flex-1">
        {{ campaign.description }}
      </p>

      <!-- ── Footer ── -->
      <div
        class="flex items-center justify-between pt-3 mt-auto border-t border-outline-variant/10"
      >
        <!-- GM info -->
        <div class="flex items-center gap-2 min-w-0">
          <!-- Avatar -->
          <img
            v-if="campaign.profiles?.avatar_url"
            :src="campaign.profiles.avatar_url"
            :alt="campaign.profiles.full_name || campaign.profiles.username || 'GM'"
            class="size-6 rounded-full object-cover shrink-0"
          />
          <div
            v-else
            class="size-6 rounded-full bg-surface-variant flex items-center justify-center shrink-0"
          >
            <UIcon name="i-lucide-user" class="size-3 text-on-surface-dim" />
          </div>

          <!-- Nombre -->
          <span class="font-body text-label-sm text-on-surface-dim truncate">
            {{
              campaign.profiles?.username
                ? `@${campaign.profiles.username}`
                : (campaign.profiles?.full_name ?? "GM desconocido")
            }}
          </span>
        </div>

        <!-- Ubicación -->
        <div
          v-if="campaign.location_name"
          class="flex items-center gap-1 ml-2 shrink-0"
        >
          <UIcon name="i-lucide-map-pin" class="size-3 text-on-surface-dim" />
          <span
            class="font-body text-label-sm text-on-surface-dim truncate max-w-24"
          >
            {{ campaign.location_name.split(",")[0] }}
          </span>
        </div>
        <div
          class="flex items-center gap-1 ml-2 shrink-0"
          v-else-if="campaign.language"
        >
          <UIcon name="i-lucide-map-pin" class="size-3 text-on-surface-dim" />
          <span
            class="font-body text-label-sm text-on-surface-dim truncate max-w-24"
          >
            {{ campaign.language.toUpperCase() }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
