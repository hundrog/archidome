<script setup lang="ts">
const props = defineProps<{
  search: string;
  mode: string | null;
  nearby: boolean;
  radius: number;
  geoLoading: boolean;
  geoError: string | null;
  hasCoords: boolean;
}>();

const emit = defineEmits<{
  "update:search": [value: string];
  "update:mode": [value: string | null];
  "update:nearby": [value: boolean];
  "update:radius": [value: number];
  toggleNearby: [];
}>();

const { t } = useI18n();

const modeOptions = computed(() => [
  { label: t("campaign.search.modeAll"), value: null },
  { label: t("campaign.playMode.remote"), value: "remote" },
  { label: t("campaign.playMode.in_person"), value: "in_person" },
  { label: t("campaign.playMode.hybrid"), value: "hybrid" },
]);

const radiusOptions = [
  { label: "2 km", value: 2 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
];

function onSearchInput(event: Event) {
  emit("update:search", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="w-full mx-auto">
    <div class="glass ghost-border rounded-xl p-1.5 gap-1 grid grid-cols-8">
      <div
        class="flex items-center gap-3 flex-1 px-4 py-2 col-span-8 lg:col-span-4"
      >
        <UIcon
          name="i-lucide-search"
          class="size-4 shrink-0 text-on-surface-dim"
        />
        <input
          :value="search"
          type="text"
          :placeholder="$t('campaign.search.placeholder')"
          class="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-dim text-body-md outline-none font-body"
          @input="onSearchInput"
        />
      </div>

      <div
        class="flex items-center gap-1 px-4 py-2 col-span-4 lg:col-span-2 lg:gap-3"
      >
        <UIcon
          name="i-lucide-layout-grid"
          class="size-4 shrink-0 text-on-surface-dim"
        />
        <USelect
          :model-value="mode"
          :items="modeOptions"
          value-key="value"
          label-key="label"
          variant="ghost"
          size="md"
          class="flex-1 bg-transparent text-on-surface text-body-md outline-none font-body cursor-pointer"
          :placeholder="$t('campaign.search.modeAll')"
          @update:model-value="(val) => emit('update:mode', val)"
        />
      </div>

      <div
        class="flex items-center gap-1 px-4 py-2 col-span-4 lg:col-span-2 lg:gap-3"
      >
        <UIcon
          :name="nearby ? 'i-lucide-map-pin' : 'i-lucide-map-pin-off'"
          class="size-4 shrink-0"
          :class="nearby ? 'text-primary' : 'text-on-surface-dim'"
        />
        <button
          class="flex-1 text-left text-body-md font-body cursor-pointer outline-none"
          :class="nearby ? 'text-primary' : 'text-on-surface-dim'"
          :disabled="geoLoading"
          @click="emit('toggleNearby')"
        >
          <span v-if="geoLoading">{{ $t("campaign.search.searching") }}</span>
          <span v-else-if="nearby">{{ $t("campaign.search.distance") }}</span>
          <span v-else>{{ $t("campaign.search.anywhere") }}</span>
        </button>

        <Transition name="fade" v-if="nearby">
          <USelect
            key="nearby-radius"
            :model-value="radius"
            :items="radiusOptions"
            value-key="value"
            label-key="label"
            size="md"
            class="bg-transparent text-primary text-label-md outline-none font-body cursor-pointer"
            @update:model-value="(val) => emit('update:radius', val)"
          />
        </Transition>
      </div>
    </div>

    <p v-if="geoError && !hasCoords" class="text-xs text-error mt-2 px-2">
      {{ geoError }}
    </p>

    <p v-if="nearby && hasCoords" class="text-xs text-on-surface-dim mt-2 px-2">
      {{ $t("campaign.search.nearbyHint", { radius }) }}
    </p>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
