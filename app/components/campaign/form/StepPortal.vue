<!-- components/campaign/form/StepPortal.vue -->
<script setup lang="ts">
import { portalSchema } from "@/schemas/campaign";

const campaignStore = useCampaignStore();
const { t } = useI18n();

const playModeOptions = computed(() => [
  {
    label: t("campaign.playMode.remote"),
    value: "remote",
    icon: "i-lucide-monitor",
    description: t("campaign.playModeDesc.remote"),
  },
  {
    label: t("campaign.playMode.in_person"),
    value: "in_person",
    icon: "i-lucide-users",
    description: t("campaign.playModeDesc.in_person"),
  },
  {
    label: t("campaign.playMode.hybrid"),
    value: "hybrid",
    icon: "i-lucide-shuffle",
    description: t("campaign.playModeDesc.hybrid"),
  },
]);

const platformOptions = computed(() => [
  { label: t("campaign.platform.discord"), value: "discord", icon: "i-simple-icons-discord" },
  { label: t("campaign.platform.roll20"), value: "roll20", icon: "i-simple-icons-roll20" },
  { label: t("campaign.platform.foundry"), value: "foundry", icon: "i-lucide-castle" },
  {
    label: t("campaign.platform.google_meet"),
    value: "google_meet",
    icon: "i-simple-icons-googlemeet",
  },
  {
    label: t("campaign.platform.tabletop_simulator"),
    value: "tabletop_simulator",
    icon: "i-lucide-box",
  },
  { label: t("campaign.platform.other"), value: "other", icon: "i-lucide-more-horizontal" },
]);

const frequencyOptions = computed(() => [
  { label: t("campaign.frequency.weekly"), value: "weekly" },
  { label: t("campaign.frequency.biweekly"), value: "biweekly" },
  { label: t("campaign.frequency.monthly"), value: "monthly" },
  { label: t("campaign.frequency.irregular"), value: "irregular" },
]);

const durationOptions = computed(() => [
  { label: t("campaign.duration.1_2"), value: "1-2 horas" },
  { label: t("campaign.duration.2_3"), value: "2-3 horas" },
  { label: t("campaign.duration.3_4"), value: "3-4 horas" },
  { label: t("campaign.duration.4plus"), value: "4+ horas" },
]);

const timezoneOptions = computed(() => [
  { label: t("campaign.timezone.utc_m8"), value: "UTC-8" },
  { label: t("campaign.timezone.utc_m7"), value: "UTC-7" },
  { label: t("campaign.timezone.utc_m6"), value: "UTC-6" },
  { label: t("campaign.timezone.utc_m5"), value: "UTC-5" },
  { label: t("campaign.timezone.utc_m4"), value: "UTC-4" },
  { label: t("campaign.timezone.utc_0"), value: "UTC+0" },
  { label: t("campaign.timezone.utc_p1"), value: "UTC+1" },
  { label: t("campaign.timezone.utc_p2"), value: "UTC+2" },
]);

const showPlatform = computed(
  () =>
    campaignStore.form.play_mode === "remote" ||
    campaignStore.form.play_mode === "hybrid",
);
const showLocation = computed(
  () =>
    campaignStore.form.play_mode === "in_person" ||
    campaignStore.form.play_mode === "hybrid",
);
</script>

<template>
  <UForm :schema="portalSchema" :state="campaignStore.form" class="space-y-8">
    <UFormField
      :label="$t('campaign.form.gameFormat')"
      name="play_mode"
      required
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
        <button
          v-for="opt in playModeOptions"
          :key="opt.value"
          type="button"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
          :class="
            campaignStore.form.play_mode === opt.value
              ? 'bg-primary/20 ghost-border border-primary/40 text-on-surface'
              : 'bg-surface-high text-on-surface-dim hover:bg-surface-bright'
          "
          :style="
            campaignStore.form.play_mode === opt.value
              ? { borderColor: 'rgba(159,167,255,0.4)' }
              : {}
          "
          @click="campaignStore.form.play_mode = opt.value as any"
        >
          <div
            class="size-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
            :class="
              campaignStore.form.play_mode === opt.value
                ? 'bg-primary/20'
                : 'bg-surface-variant'
            "
          >
            <UIcon
              :name="opt.icon"
              class="size-4"
              :class="
                campaignStore.form.play_mode === opt.value
                  ? 'text-primary'
                  : 'text-on-surface-dim'
              "
            />
          </div>
          <div>
            <p
              class="font-body font-medium text-body-sm"
              :class="
                campaignStore.form.play_mode === opt.value
                  ? 'text-on-surface'
                  : 'text-on-surface-dim'
              "
            >
              {{ opt.label }}
            </p>
            <p class="font-body text-label-sm text-on-surface-dim">
              {{ opt.description }}
            </p>
          </div>
          <UIcon
            v-if="campaignStore.form.play_mode === opt.value"
            name="i-lucide-check-circle"
            class="size-4 text-primary ml-auto shrink-0"
          />
        </button>
      </div>
    </UFormField>

    <Transition name="fade">
      <UFormField
        v-if="showPlatform"
        :label="$t('campaign.form.virtualPlatform')"
        name="virtual_platform"
      >
        <USelectMenu
          v-model="campaignStore.form.virtual_platform"
          :items="platformOptions"
          value-key="value"
          label-key="label"
          :placeholder="$t('campaign.form.platformPlaceholder')"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </Transition>

    <Transition name="fade">
      <CampaignLocationField
        v-if="showLocation"
        :initial-location="campaignStore.form.location_name"
        :initial-coords="
          campaignStore.form.lat && campaignStore.form.lng
            ? { lat: campaignStore.form.lat, lng: campaignStore.form.lng }
            : null
        "
        @update="
          (data) =>
            campaignStore.setLocation(
              data.locationName,
              data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null,
            )
        "
      />
    </Transition>

    <USeparator />

    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">
        {{ $t("campaign.form.scheduling") }}
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormField :label="$t('campaign.form.frequency')" name="frequency">
          <USelectMenu
            v-model="campaignStore.form.frequency"
            :items="frequencyOptions"
            value-key="value"
            label-key="label"
            :placeholder="$t('campaign.form.frequencyPlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('campaign.form.language')" name="language">
          <UInput
            v-model="campaignStore.form.language"
            :placeholder="$t('campaign.form.languagePlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('campaign.form.timezone')" name="timezone">
          <USelectMenu
            v-model="campaignStore.form.timezone"
            :items="timezoneOptions"
            value-key="value"
            label-key="label"
            :placeholder="$t('campaign.form.timezonePlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('campaign.form.duration')" name="duration">
          <USelectMenu
            v-model="campaignStore.form.duration"
            :items="durationOptions"
            value-key="value"
            label-key="label"
            :placeholder="$t('campaign.form.durationPlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>
      </div>
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
