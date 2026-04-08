<script setup lang="ts">
import type { Database } from "@/types/database.types";
import { useCampaignStore } from "@/stores/campaign";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & {
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    discord: string | null;
    whatsapp: string | null;
    twitter: string | null;
    instagram: string | null;
  } | null;
};

// ─── Setup ────────────────────────────────────────────────────────────────────
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const store = useCampaignStore();
const id = route.params.id as string;

// ─── Fetch ────────────────────────────────────────────────────────────────────
const { data: campaign, pending } = await useAsyncData(
  `campaign-${id}`,
  async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "*, profiles!campaigns_profile_fkey(full_name, username, avatar_url, bio, discord, whatsapp, twitter, instagram)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Campaign;
  },
);

if (!campaign.value) {
  throw createError({ statusCode: 404, message: "Campaña no encontrada" });
}

// ─── Owner ────────────────────────────────────────────────────────────────────
const isOwner = computed(
  () => !!user.value && user.value.sub === campaign.value?.user_id,
);

// ─── Delete ───────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false);

async function deleteCampaign() {
  try {
    store.currentCampaign = campaign.value as any;
    await store.deleteCampaign(id);
    toast.add({ title: "Campaña eliminada", color: "success" });
    router.push("/campaigns");
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err.message,
      color: "error",
    });
  } finally {
    showDeleteModal.value = false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeImageUrl = computed(() => {
  const url = campaign.value?.image_url;
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
});

const playModeLabel: Record<string, string> = {
  remote: "Remoto",
  in_person: "Presencial",
  hybrid: "Híbrido",
};

const frequencyLabel: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  irregular: "Irregular",
};

const platformLabel: Record<string, string> = {
  discord: "Discord",
  roll20: "Roll20",
  foundry: "Foundry VTT",
  google_meet: "Google Meet",
  tabletop_simulator: "Tabletop Simulator",
  other: "Otro",
};

const houseRules = computed(() => {
  const raw = campaign.value?.house_rules;
  if (!raw || !Array.isArray(raw)) return [];
  return raw as { title: string; description?: string }[];
});

const styleTags = computed(() => {
  const raw = campaign.value?.style_tags;
  if (!Array.isArray(raw)) return [];
  return raw as string[];
});

const proxiedAvatar = computed(() => {
  const originalUrl = campaign.value?.profiles?.avatar_url;
  return originalUrl 
    ? `/api/proxy-image?url=${encodeURIComponent(originalUrl)}` 
    : '/default-avatar.png';
});

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => campaign.value?.title ?? "Campaña",
  description: () => campaign.value?.description ?? "",
  ogImage: () => campaign.value?.image_url ?? undefined,
});
</script>

<template>
  <div class="min-h-screen bg-surface text-on-surface">
    <!-- ── Loading ── -->
    <div
      v-if="pending"
      class="max-w-6xl mx-auto px-4 py-12 space-y-6 animate-pulse"
    >
      <div class="h-96 rounded-xl bg-surface-high" />
      <div class="h-6 bg-surface-high rounded w-2/3" />
      <div class="h-4 bg-surface-high rounded w-1/2" />
    </div>

    <template v-else-if="campaign">
      <!-- ── Hero ── -->
      <section
        class="relative min-h-130 flex flex-col justify-end overflow-hidden"
      >
        <div class="absolute inset-0 z-0">
          <NuxtImg
            v-if="safeImageUrl"
            :src="safeImageUrl"
            :alt="campaign.title"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-surface-low" />
          <div class="absolute inset-0 bg-surface/50" />
          <div
            class="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-surface to-transparent"
          />
        </div>

        <!-- Contenido -->
        <div
          class="relative z-10 px-6 pb-10 max-w-6xl mx-auto w-full space-y-3"
        >
          <div class="flex flex-wrap gap-2">
            <span
              class="label-metadata px-3 py-1 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0"
              style="background: rgba(159, 167, 255, 0.15); color: #9fa7ff"
            >
              {{ campaign.system }}
            </span>
            <span
              class="label-metadata px-3 py-1 rounded-md flex items-center gap-1.5"
              style="background: rgba(74, 222, 128, 0.15); color: #4ade80"
            >
              <span class="size-1.5 rounded-full bg-green-400 inline-block" />
              Reclutando
            </span>
          </div>
          <h1
            class="font-display text-display-md text-white leading-tight max-w-2xl"
          >
            {{ campaign.title }}
          </h1>
          <p class="font-body text-body-lg text-on-surface-dim max-w-xl">
            {{ campaign.hook }}
          </p>
        </div>
      </section>

      <!-- ── Logistics + GM ── -->
      <section class="max-w-6xl mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Session Logistics -->
          <div class="bg-surface-low rounded-xl p-6 space-y-5">
            <h3 class="label-metadata text-on-surface-dim">
              Session Logistics
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">
                    Schedule
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{
                      campaign.frequency
                        ? frequencyLabel[campaign.frequency]
                        : "—"
                    }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-monitor"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">Format</p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{ playModeLabel[campaign.play_mode] }}
                    <span
                      v-if="campaign.virtual_platform"
                      class="text-on-surface-dim"
                    >
                      / {{ platformLabel[campaign.virtual_platform] }}</span
                    >
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-users"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">Spots</p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{ campaign.current_players }} /
                    {{ campaign.max_players }} jugadores
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-globe"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">
                    Language
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{ campaign.language }}
                  </p>
                </div>
              </div>
              <div v-if="campaign.duration" class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-clock"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">
                    Duration
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{ campaign.duration }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-swords"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">
                    Start Level
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    Nivel {{ campaign.start_level }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Master -->
          <div class="bg-surface-low rounded-xl p-6 space-y-5">
            <h3 class="label-metadata text-on-surface-dim">Game Master</h3>
            <div class="flex items-start gap-4">
              <UAvatar
                v-if="campaign.profiles?.avatar_url"
                :src="proxiedAvatar"
                :alt="campaign.profiles.full_name ?? 'GM'"
                class="size-8 rounded-full object-cover ring-2 ring-surface-variant shrink-0"
              />
              <div
                v-else
                class="size-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0"
              >
                <UIcon
                  name="i-lucide-user"
                  class="size-7 text-on-surface-dim"
                />
              </div>
              <div class="flex-1 min-w-0 space-y-1">
                <h4 class="font-display text-headline-sm text-on-surface">
                  {{ campaign.profiles?.full_name ?? "GM desconocido" }}
                </h4>
                <p
                  v-if="campaign.profiles?.username"
                  class="font-body text-label-sm text-on-surface-dim"
                >
                  @{{ campaign.profiles.username }}
                </p>
                <p
                  v-if="campaign.profiles?.bio"
                  class="font-body text-body-sm text-on-surface-dim line-clamp-3 mt-2 italic"
                >
                  "{{ campaign.profiles.bio }}"
                </p>
              </div>
            </div>
            <div
              v-if="
                campaign.profiles?.discord ||
                campaign.profiles?.whatsapp ||
                campaign.profiles?.twitter ||
                campaign.profiles?.instagram
              "
              class="pt-2 space-y-2"
            >
              <p class="label-metadata text-on-surface-dim">Contacto</p>
              <div class="flex flex-wrap gap-2">
                <div
                  v-if="campaign.profiles?.discord"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-discord"
                    class="size-4"
                    style="color: #5865f2"
                  />
                  {{ campaign.profiles?.discord }}
                </div>
                <div
                  v-if="campaign.profiles?.whatsapp"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-whatsapp"
                    class="size-4"
                    style="color: #25d366"
                  />
                  {{ campaign.profiles?.whatsapp }}
                </div>
                <div
                  v-if="campaign.profiles?.twitter"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-x"
                    class="size-4 text-on-surface"
                  />
                  Twitter
                </div>
                <div
                  v-if="campaign.profiles?.instagram"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-instagram"
                    class="size-4"
                    style="color: #e1306c"
                  />
                  Instagram
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Descripción + Sidebar ── -->
      <section class="max-w-6xl mx-auto px-6 pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Izquierda -->
          <div class="lg:col-span-2 space-y-10">
            <!-- About -->
            <div class="space-y-4">
              <h2
                class="font-display text-headline-md text-on-surface flex items-center gap-2"
              >
                <UIcon name="i-lucide-book-open" class="size-5 text-primary" />
                About the Adventure
              </h2>
              <p
                class="font-body text-body-md text-on-surface-dim leading-relaxed whitespace-pre-line"
              >
                {{ campaign.description }}
              </p>
            </div>

            <!-- House Rules -->
            <div v-if="houseRules.length" class="space-y-4">
              <h2
                class="font-display text-headline-md text-on-surface flex items-center gap-2"
              >
                <UIcon name="i-lucide-scroll" class="size-5 text-primary" />
                House Rules
              </h2>
              <div class="space-y-3">
                <div
                  v-for="(rule, idx) in houseRules"
                  :key="idx"
                  class="flex items-start gap-4 p-4 rounded-xl bg-surface-low"
                >
                  <div
                    class="size-7 rounded-full bg-surface-variant flex items-center justify-center shrink-0 mt-0.5"
                  >
                    <span class="font-body text-label-sm text-on-surface-dim">{{
                      idx + 1
                    }}</span>
                  </div>
                  <div>
                    <p
                      class="font-body text-body-sm text-on-surface font-medium"
                    >
                      {{ rule.title }}
                    </p>
                    <p
                      v-if="rule.description"
                      class="font-body text-label-sm text-on-surface-dim mt-0.5"
                    >
                      {{ rule.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Derecha: What to Expect -->
          <div class="space-y-4">
            <h2 class="font-display text-headline-md text-on-surface">
              What to Expect
            </h2>
            <div class="space-y-3">
              <div
                v-for="tag in styleTags"
                :key="tag"
                class="p-4 rounded-xl bg-surface-high"
              >
                <UIcon
                  name="i-lucide-sparkles"
                  class="size-5 text-secondary mb-2"
                />
                <p class="font-body text-body-sm text-on-surface font-medium">
                  {{ tag }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
