<!-- components/campaign/form/StepHook.vue -->
<script setup lang="ts">
import { hookSchema } from "@/schemas/campaign";

const campaignStore = useCampaignStore();
const { t, tm } = useI18n();

const hookLength = computed(() => campaignStore.form.hook?.length ?? 0);
const descLength = computed(() => campaignStore.form.description?.length ?? 0);

const systemSuggestions = computed(
  () => tm("campaign.form.systemSuggestions") as string[],
);

const showSuggestions = ref(false);
const filteredSystems = computed(() =>
  campaignStore.form.system
    ? systemSuggestions.value.filter((s) =>
        s
          .toLowerCase()
          .includes(campaignStore.form.system?.toLowerCase() ?? ""),
      )
    : systemSuggestions.value,
);

function selectSystem(system: string) {
  campaignStore.form.system = system;
  showSuggestions.value = false;
}

async function onBlur() {
  setTimeout(() => (showSuggestions.value = false), 150);
}
</script>

<template>
  <UForm :schema="hookSchema" :state="campaignStore.form" class="space-y-6">
    <UFormField
      :label="$t('campaign.form.hook.titleLabel')"
      name="title"
      required
      :hint="$t('campaign.form.hook.titleHint')"
    >
      <UInput
        v-model="campaignStore.form.title"
        :placeholder="$t('campaign.form.hook.titlePlaceholder')"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="$t('campaign.form.hook.systemLabel')"
      name="system"
      required
    >
      <div class="relative">
        <UInput
          v-model="campaignStore.form.system"
          :placeholder="$t('campaign.form.hook.systemPlaceholder')"
          size="lg"
          class="w-full"
          autocomplete="off"
          @focus="showSuggestions = true"
          @blur="onBlur"
        />
        <Transition name="fade">
          <div
            v-if="showSuggestions && filteredSystems.length"
            class="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg bg-surface-high ghost-border shadow-ambient overflow-hidden"
          >
            <button
              v-for="s in filteredSystems.slice(0, 6)"
              :key="s"
              class="w-full text-left px-4 py-2.5 font-body text-body-sm text-on-surface hover:bg-surface-bright transition-colors"
              @mousedown="selectSystem(s)"
            >
              {{ s }}
            </button>
          </div>
        </Transition>
      </div>
    </UFormField>

    <UFormField
      :label="$t('campaign.form.hook.hookLabel')"
      name="hook"
      required
      :hint="
        $t('campaign.form.hook.hookHint', {
          n: hookLength,
        })
      "
    >
      <UTextarea
        v-model="campaignStore.form.hook"
        :placeholder="$t('campaign.form.hook.hookPlaceholder')"
        :rows="3"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="$t('campaign.form.hook.descriptionLabel')"
      name="description"
      :hint="
        $t('campaign.form.hook.descriptionHint', {
          n: descLength,
        })
      "
    >
      <UTextarea
        v-model="campaignStore.form.description"
        :placeholder="$t('campaign.form.hook.descriptionPlaceholder')"
        :rows="8"
        size="lg"
        class="w-full"
      />
    </UFormField>
  </UForm>
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
  transform: translateY(-4px);
}
</style>
