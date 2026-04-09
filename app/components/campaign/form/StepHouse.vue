// components/campaign/form/StepHouse.vue
<script setup lang="ts">
interface FetchProject {
  id: string;
  name: string;
}
import type { Database } from "@/types/database.types";
type Project = Database["public"]["Tables"]["projects"]["Row"];

const campaignStore = useCampaignStore();
const { t } = useI18n();

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const projects = ref<FetchProject[]>([]);

async function fetchProjects() {
  try {
    const { data, error } = await supabase
      .from("profile_projects")
      .select(
        `
      owner,
      status,
      projects (
        id,
        name,
        slug,
        created_at
      )
    `,
      )
      .eq("profile_id", user.value!.sub)
      .or("owner.eq.true,status.eq.accepted")
      .order("created_at", { foreignTable: "projects", ascending: false });

    if (error) throw error;

    projects.value = data.map((item) => {
      const project = item.projects as unknown as Project;

      return {
        ...project,
        isOwner: item.owner,
        memberStatus: item.status,
      };
    });
  } catch (err: any) {
  }
}

onMounted(() => {
  fetchProjects();
});

watch(user, () => {
  if (user.value) {
    fetchProjects();
  }
});

const projectOptions = computed(() =>
  projects.value.map((p: any) => ({ label: p.name, value: p.id })),
);

const playModeLabel = computed(() => ({
  remote: t("campaign.playMode.remote"),
  in_person: t("campaign.playMode.in_person"),
  hybrid: t("campaign.playMode.hybrid"),
}));

const platformLabel = computed(() => ({
  discord: t("campaign.platform.discord"),
  roll20: t("campaign.platform.roll20"),
  foundry: t("campaign.platform.foundry"),
  google_meet: t("campaign.platform.google_meet"),
  tabletop_simulator: t("campaign.platform.tabletop_simulator"),
  other: t("campaign.platform.other"),
}));

const frequencyLabel = computed(() => ({
  weekly: t("campaign.frequency.weekly"),
  biweekly: t("campaign.frequency.biweekly"),
  monthly: t("campaign.frequency.monthly"),
  irregular: t("campaign.frequency.irregular"),
}));

const emDash = computed(() => t("pages.campaignDetail.emDash"));

const summaryItems = computed(() =>
  [
    {
      icon: "i-lucide-scroll",
      label: t("campaign.form.house.labelSystem"),
      value: campaignStore.form.system,
    },
    {
      icon: "i-lucide-monitor",
      label: t("campaign.form.house.labelMode"),
      value: campaignStore.form.play_mode
        ? playModeLabel.value[campaignStore.form.play_mode]
        : emDash.value,
    },
    {
      icon: "i-lucide-users",
      label: t("campaign.form.house.labelPlayers"),
      value: `${campaignStore.form.current_players} / ${campaignStore.form.max_players}`,
    },
    {
      icon: "i-lucide-swords",
      label: t("campaign.form.house.labelLevel"),
      value: t("campaign.form.house.levelN", {
        n: campaignStore.form.start_level ?? 1,
      }),
    },
    {
      icon: "i-lucide-calendar",
      label: t("campaign.form.house.labelFrequency"),
      value: campaignStore.form.frequency
        ? frequencyLabel.value[campaignStore.form.frequency]
        : emDash.value,
    },
    {
      icon: "i-lucide-globe",
      label: t("campaign.form.house.labelLanguage"),
      value: campaignStore.form.language,
    },
    {
      icon: "i-lucide-layout-grid",
      label: t("campaign.form.house.labelPlatform"),
      value: campaignStore.form.virtual_platform
        ? platformLabel.value[campaignStore.form.virtual_platform]
        : emDash.value,
    },
  ].filter((i) => i.value && i.value !== emDash.value),
);
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">
        {{ $t("campaign.form.house.summaryTitle") }}
      </h3>

      <div class="p-5 rounded-xl bg-surface-low space-y-4">
        <div>
          <h2 class="font-display text-headline-sm text-on-surface">
            {{
              campaignStore.form.title || $t("campaign.form.house.noTitle")
            }}
          </h2>
          <p
            class="font-body text-body-sm text-on-surface-dim mt-1 line-clamp-2"
          >
            {{
              campaignStore.form.hook || $t("campaign.form.house.noHook")
            }}
          </p>
        </div>

        <div
          v-if="campaignStore?.form?.style_tags?.length"
          class="flex flex-wrap gap-1.5"
        >
          <span
            v-for="tag in campaignStore.form.style_tags.slice(0, 5)"
            :key="tag"
            class="px-2.5 py-1 rounded-md font-body text-label-md"
            :style="{ background: '#62259b', color: '#e4c4ff' }"
          >
            {{ tag }}
          </span>
          <span
            v-if="campaignStore.form.style_tags.length > 5"
            class="px-2.5 py-1 rounded-md font-body text-label-md bg-surface-high text-on-surface-dim"
          >
            +{{ campaignStore.form.style_tags.length - 5 }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="item in summaryItems"
            :key="item.label"
            class="flex items-center gap-2"
          >
            <UIcon :name="item.icon" class="size-3.5 text-primary shrink-0" />
            <div>
              <p class="label-metadata" style="font-size: 0.6rem">
                {{ item.label }}
              </p>
              <p class="font-body text-label-sm text-on-surface">
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <USeparator />

    <div class="space-y-2">
      <h3 class="label-metadata text-on-surface-dim">
        {{ $t("campaign.form.house.coverImage") }}
      </h3>
      <CampaignImageField
        :initial-url="campaignStore.imagePreview"
        @update="
          ({ file, removed }) => {
            if (removed) campaignStore.removeImage();
            else campaignStore.setImage(file);
          }
        "
      />
    </div>

    <USeparator />

    <UFormField
      :label="$t('campaign.form.house.project')"
      name="project_id"
      required
      :hint="$t('campaign.form.house.projectHint')"
    >
      <USelectMenu
        v-model="campaignStore.form.project_id"
        :items="projectOptions"
        value-key="value"
        label-key="label"
        :placeholder="$t('campaign.form.house.projectPlaceholder')"
        size="lg"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
