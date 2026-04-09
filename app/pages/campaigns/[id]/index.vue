<script setup lang="ts">
import { toPng } from "html-to-image";
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

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const store = useCampaignStore();
const { t } = useI18n();
const id = route.params.id as string;
const downloading = ref(false);

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
  throw createError({
    statusCode: 404,
    message: t("pages.campaignDetail.notFound"),
  });
}

const isOwner = computed(
  () => !!user.value && user.value.sub === campaign.value?.user_id,
);

const showDeleteModal = ref(false);

async function deleteCampaign() {
  try {
    store.currentCampaign = campaign.value as any;
    await store.deleteCampaign(id);
    toast.add({ title: t("pages.campaignDetail.deleted"), color: "success" });
    router.push("/campaigns");
  } catch (err: any) {
    toast.add({
      title: t("pages.campaignDetail.deleteError"),
      description: err.message,
      color: "error",
    });
  } finally {
    showDeleteModal.value = false;
  }
}

const safeImageUrl = computed(() => {
  const url = campaign.value?.image_url;
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
});

const playModeLabel = computed(() => ({
  remote: t("campaign.playMode.remote"),
  in_person: t("campaign.playMode.in_person"),
  hybrid: t("campaign.playMode.hybrid"),
}));

const frequencyLabel = computed(() => ({
  weekly: t("campaign.frequency.weekly"),
  biweekly: t("campaign.frequency.biweekly"),
  monthly: t("campaign.frequency.monthly"),
  irregular: t("campaign.frequency.irregular"),
}));

const platformLabel = computed(() => ({
  discord: t("campaign.platform.discord"),
  roll20: t("campaign.platform.roll20"),
  foundry: t("campaign.platform.foundry"),
  google_meet: t("campaign.platform.google_meet"),
  tabletop_simulator: t("campaign.platform.tabletop_simulator"),
  other: t("campaign.platform.other"),
}));

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

async function downloadCampaignImage() {
  const node = document.getElementById("share-card-container");

  if (!node || !campaign.value) {
    toast.add({
      title: t("common.error"),
      description: t("pages.campaignDetail.shareNotFound"),
      color: "error",
    });
    return;
  }

  downloading.value = true;

  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const dataUrl = await toPng(node, {
      skipFonts: true,
      cacheBust: true,
      quality: 0.95,
    });

    const link = document.createElement("a");
    const fileName = `${campaign.value.title.toLowerCase().replace(/ /g, "-")}-share.png`;

    link.download = fileName;
    link.href = dataUrl;
    link.click();

    toast.add({
      title: t("pages.campaignDetail.imageGenerated"),
      description: t("pages.campaignDetail.imageGeneratedDesc"),
      color: "success",
    });
  } catch (err: any) {
    console.error("oops, something went wrong!", err);
    toast.add({
      title: t("pages.campaignDetail.imageGenError"),
      description: err.message,
      color: "error",
    });
  } finally {
    downloading.value = false;
  }
}

useSeoMeta({
  title: () => campaign.value?.title ?? t("pages.campaignDetail.seoFallbackTitle"),
  description: () => campaign.value?.description ?? "",
  ogImage: () => campaign.value?.image_url ?? undefined,
});
</script>

<template>
  <div class="min-h-screen bg-surface text-on-surface">
    <div
      v-if="pending"
      class="max-w-6xl mx-auto px-4 py-12 space-y-6 animate-pulse"
    >
      <div class="h-96 rounded-xl bg-surface-high" />
      <div class="h-6 bg-surface-high rounded w-2/3" />
      <div class="h-4 bg-surface-high rounded w-1/2" />
    </div>

    <template v-else-if="campaign">
      <section
        class="relative min-h-130 flex flex-col justify-end overflow-hidden"
      >
        <div
          class="relative z-10 px-6 pb-10 max-w-6xl mx-auto w-full space-y-3"
        >
          <NuxtLink
            to="/campaigns"
            class="inline-flex items-center gap-2 font-body text-label-xl text-on-surface-dim hover:text-on-surface transition-colors mb-6"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            {{ $t("pages.campaignDetail.back") }}
          </NuxtLink>
        </div>
        <div class="absolute inset-0 z-0">
          <img
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

        <div class="absolute bottom-16 right-6 z-20 flex gap-2">
          <UButton
            icon="i-lucide-image"
            color="primary"
            variant="ghost"
            :loading="downloading"
            @click="downloadCampaignImage"
          />
          <UButton
            v-if="isOwner"
            :to="`/campaigns/${id}/edit`"
            icon="i-lucide-pencil"
            variant="soft"
            color="secondary"
            class="rounded-full"
          />
          <UButton
            v-if="isOwner"
            icon="i-lucide-trash-2"
            variant="soft"
            color="error"
            class="rounded-full"
            @click="showDeleteModal = true"
          />
        </div>

        <div
          class="relative z-10 px-6 pb-10 max-w-6xl mx-auto w-full space-y-3"
        >
          <div class="flex flex-wrap gap-2">
            <span
              class="label-metadata px-3 py-1 rounded-md"
              style="background: rgba(159, 167, 255, 0.15); color: #9fa7ff"
            >
              {{ campaign.system }}
            </span>
            <span
              class="label-metadata px-3 py-1 rounded-md flex items-center gap-1.5"
              style="background: rgba(74, 222, 128, 0.15); color: #4ade80"
            >
              <span class="size-1.5 rounded-full bg-green-400 inline-block" />
              {{ $t("pages.campaignDetail.recruiting") }}
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

      <section class="max-w-6xl mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-surface-low rounded-xl p-6 space-y-5">
            <h3 class="label-metadata text-on-surface-dim">
              {{ $t("pages.campaignDetail.sessionLogistics") }}
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-4 text-on-surface-dim mt-0.5 shrink-0"
                />
                <div>
                  <p class="label-metadata" style="font-size: 0.6rem">
                    {{ $t("pages.campaignDetail.schedule") }}
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{
                      campaign.frequency
                        ? frequencyLabel[campaign.frequency]
                        : $t("pages.campaignDetail.emDash")
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
                  <p class="label-metadata" style="font-size: 0.6rem">
                    {{ $t("pages.campaignDetail.format") }}
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{ playModeLabel[campaign.play_mode] }}
                    <span
                      v-if="campaign.virtual_platform"
                      class="text-on-surface-dim"
                    >
                      /
                      {{ platformLabel[campaign.virtual_platform] }}</span
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
                  <p class="label-metadata" style="font-size: 0.6rem">
                    {{ $t("pages.campaignDetail.spots") }}
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{
                      $t("pages.campaignDetail.playersCount", {
                        current: campaign.current_players,
                        max: campaign.max_players,
                      })
                    }}
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
                    {{ $t("pages.campaignDetail.language") }}
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
                    {{ $t("pages.campaignDetail.duration") }}
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
                    {{ $t("pages.campaignDetail.startLevel") }}
                  </p>
                  <p class="font-body text-body-sm text-on-surface">
                    {{
                      $t("pages.campaignDetail.levelN", {
                        n: campaign.start_level,
                      })
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-surface-low rounded-xl p-6 space-y-5">
            <h3 class="label-metadata text-on-surface-dim">
              {{ $t("pages.campaignDetail.gameMaster") }}
            </h3>
            <div class="flex items-start gap-4">
              <img
                v-if="campaign.profiles?.avatar_url"
                :src="campaign.profiles.avatar_url"
                :alt="campaign.profiles.full_name ?? $t('pages.campaignDetail.gmAlt')"
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
                  {{
                    campaign.profiles?.full_name ??
                    $t("pages.campaignDetail.gmUnknown")
                  }}
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
              <p class="label-metadata text-on-surface-dim">
                {{ $t("pages.campaignDetail.contact") }}
              </p>
              <div class="flex flex-wrap gap-2">
                <ULink
                  v-if="campaign.profiles?.discord"
                  :href="`https://discord.com/users/${campaign.profiles.discord}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-discord"
                    class="size-4"
                    style="color: #5865f2"
                  />
                  {{ $t("pages.campaignDetail.discord") }}
                </ULink>
                <ULink
                  v-if="campaign.profiles?.whatsapp"
                  :href="`https://wa.me/${campaign.profiles.whatsapp.replace(/\D/g, '')}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-whatsapp"
                    class="size-4"
                    style="color: #25d366"
                  />
                  {{ $t("pages.campaignDetail.whatsapp") }}
                </ULink>
                <ULink
                  v-if="campaign.profiles?.twitter"
                  :href="`https://twitter.com/${campaign.profiles.twitter}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-x"
                    class="size-4 text-on-surface"
                  />
                  {{ $t("pages.campaignDetail.twitter") }}
                </ULink>
                <ULink
                  v-if="campaign.profiles?.instagram"
                  :href="`https://instagram.com/${campaign.profiles.instagram}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-high hover:bg-surface-bright transition-colors font-body text-label-md text-on-surface"
                >
                  <UIcon
                    name="i-simple-icons-instagram"
                    class="size-4"
                    style="color: #e1306c"
                  />
                  {{ $t("pages.campaignDetail.instagram") }}
                </ULink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-6 pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-10">
            <div class="space-y-4">
              <h2
                class="font-display text-headline-md text-on-surface flex items-center gap-2"
              >
                <UIcon name="i-lucide-book-open" class="size-5 text-primary" />
                {{ $t("pages.campaignDetail.aboutAdventure") }}
              </h2>
              <p
                class="font-body text-body-md text-on-surface-dim leading-relaxed whitespace-pre-line"
              >
                {{ campaign.description }}
              </p>
            </div>

            <div v-if="houseRules.length" class="space-y-4">
              <h2
                class="font-display text-headline-md text-on-surface flex items-center gap-2"
              >
                <UIcon name="i-lucide-scroll" class="size-5 text-primary" />
                {{ $t("pages.campaignDetail.houseRules") }}
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

          <div class="space-y-4">
            <h2 class="font-display text-headline-md text-on-surface">
              {{ $t("pages.campaignDetail.whatToExpect") }}
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
            <h3 class="font-display text-headline-sm text-white">
              {{ $t("pages.campaignDetail.deleteModalTitle") }}
            </h3>
          </div>
          <p class="font-body text-body-sm text-on-surface-dim">
            {{
              $t("pages.campaignDetail.deleteModalBody", {
                title: campaign?.title,
              })
            }}
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              variant="ghost"
              :label="$t('common.cancel')"
              @click="showDeleteModal = false"
            />
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :label="$t('common.delete')"
              :loading="store.loading"
              @click="deleteCampaign"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
  <div class="fixed -top-1250 -left-1250 pointer-events-none aria-hidden">
    <CampaignShareCard :campaign="campaign" id="share-card-container" />
  </div>
</template>
