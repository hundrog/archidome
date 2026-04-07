<!-- components/campaign/form/StepRules.vue -->
<script setup lang="ts">
import { rulesSchema } from "@/schemas/campaign";

const campaignStore = useCampaignStore();

// ─── Jugadores ────────────────────────────────────────────────────────────────
function decrement(
  field: "max_players" | "current_players" | "start_level",
  min: number,
) {
  const val = campaignStore.form[field] as number;
  if (val > min) campaignStore.form[field] = val - 1;
}
function increment(
  field: "max_players" | "current_players" | "start_level",
  max: number,
) {
  const val = campaignStore.form[field] as number;
  if (val < max) campaignStore.form[field] = val + 1;
}

// ─── Style tags ───────────────────────────────────────────────────────────────
const PRESET_TAGS = [
  "Heavy Roleplay",
  "Combat Heavy",
  "Investigation",
  "Sandbox",
  "Dungeon Crawl",
  "Political Intrigue",
  "Beginner Friendly",
  "Experienced Players",
  "Horror",
  "Comedy",
  "Dark Themes",
  "Homebrew",
  "One-Shot",
  "Campaign",
  "West Marches",
];

const customTag = ref("");

function toggleTag(tag: string) {
  const tags = campaignStore.form.style_tags as string[];
  const idx = tags.indexOf(tag);
  if (idx === -1) tags.push(tag);
  else tags.splice(idx, 1);
}

function addCustomTag() {
  const tag = customTag.value.trim();
  const tags = campaignStore.form.style_tags as string[];
  if (!tag || tags.includes(tag)) return;
  tags.push(tag);
  customTag.value = "";
}

// ─── House rules ──────────────────────────────────────────────────────────────
const newRule = reactive({ title: "", description: "" });

function addRule() {
  if (!newRule.title.trim()) return;
  const rules = campaignStore.form.house_rules as {
    title: string;
    description: string;
  }[];
  rules.push({
    title: newRule.title.trim(),
    description: newRule.description.trim(),
  });
  newRule.title = "";
  newRule.description = "";
}

function removeRule(idx: number) {
  const rules = campaignStore.form.house_rules as {
    title: string;
    description: string;
  }[];
  rules.splice(idx, 1);
}
</script>

<template>
  <UForm :schema="rulesSchema" :state="campaignStore.form" class="space-y-8">
    <!-- ── Player Slots ── -->
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">The Party</h3>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 place-items-center">
        <!-- Max players -->
        <UFormField class="text-center" name="max_players">
          Player Slots
          <div class="flex items-center gap-4 mt-1">
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="decrement('max_players', 1)"
            >
              <UIcon name="i-lucide-minus" class="size-4 text-on-surface" />
            </button>
            <span
              class="font-display text-display-sm text-on-surface w-8 text-center"
            >
              {{ campaignStore.form.max_players }}
            </span>
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="increment('max_players', 20)"
            >
              <UIcon name="i-lucide-plus" class="size-4 text-on-surface" />
            </button>
          </div>
        </UFormField>
        <!-- Current players -->
        <UFormField class="text-center" name="current_players">
          Current Players
          <div class="flex items-center gap-4 mt-1">
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="decrement('current_players', 1)"
            >
              <UIcon name="i-lucide-minus" class="size-4 text-on-surface" />
            </button>
            <span
              class="font-display text-display-sm text-on-surface w-8 text-center"
            >
              {{ campaignStore.form.current_players }}
            </span>
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="increment('current_players', 20)"
            >
              <UIcon name="i-lucide-plus" class="size-4 text-on-surface" />
            </button>
          </div>
        </UFormField>

        <!-- Start level -->
        <UFormField class="text-center" name="start_level">
          Start Level
          <div class="flex items-center gap-4 mt-1">
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="decrement('start_level', 1)"
            >
              <UIcon name="i-lucide-minus" class="size-4 text-on-surface" />
            </button>
            <span
              class="font-display text-display-sm text-on-surface w-8 text-center"
            >
              {{ campaignStore.form.start_level }}
            </span>
            <button
              type="button"
              class="size-9 rounded-full bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors ghost-border"
              @click="increment('start_level', 20)"
            >
              <UIcon name="i-lucide-plus" class="size-4 text-on-surface" />
            </button>
          </div>
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- ── Style Tags ── -->
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">Game Style Tags</h3>

      <!-- Preset tags -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in PRESET_TAGS"
          :key="tag"
          type="button"
          class="px-3 py-1.5 rounded-md font-body text-label-md transition-all"
          :class="
            (campaignStore.form.style_tags as string[]).includes(tag)
              ? 'bg-secondary-container text-secondary-on'
              : 'bg-surface-high text-on-surface-dim hover:bg-surface-bright'
          "
          :style="
            (campaignStore.form.style_tags as string[]).includes(tag)
              ? { background: '#62259b', color: '#e4c4ff' }
              : {}
          "
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <!-- Custom tag -->
      <div class="flex gap-2">
        <UInput
          v-model="customTag"
          placeholder="Agregar tag personalizado..."
          size="sm"
          class="flex-1"
          @keydown.enter.prevent="addCustomTag"
        />
        <UButton
          type="button"
          icon="i-lucide-plus"
          size="sm"
          variant="outline"
          label="Add"
          class="rounded-full"
          :disabled="!customTag.trim()"
          @click="addCustomTag"
        />
      </div>

      <!-- Tags seleccionados -->
      <div
        v-if="(campaignStore.form.style_tags as string[]).length"
        class="flex flex-wrap gap-2"
      >
        <span
          v-for="tag in campaignStore.form.style_tags"
          :key="tag"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-body text-label-md"
          :style="{ background: '#62259b', color: '#e4c4ff' }"
        >
          {{ tag }}
          <button
            type="button"
            class="hover:text-white transition-colors"
            @click="toggleTag(tag)"
          >
            <UIcon name="i-lucide-x" class="size-3" />
          </button>
        </span>
      </div>
    </div>

    <USeparator />

    <!-- ── House Rules ── -->
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">House Rules</h3>

      <!-- Reglas existentes -->
      <TransitionGroup name="list" tag="div" class="space-y-2">
        <div
          v-for="(rule, idx) in campaignStore.form.house_rules"
          :key="idx"
          class="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-high"
        >
          <span
            class="size-6 rounded-full bg-surface-variant flex items-center justify-center font-body text-label-sm text-on-surface-dim shrink-0 mt-0.5"
          >
            {{ idx + 1 }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-body text-body-sm text-on-surface font-medium">
              {{ rule.title }}
            </p>
            <p
              v-if="rule.description"
              class="font-body text-label-sm text-on-surface-dim mt-0.5"
            >
              {{ rule.description }}
            </p>
          </div>
          <button
            type="button"
            class="text-on-surface-dim hover:text-error transition-colors shrink-0"
            @click="removeRule(idx)"
          >
            <UIcon name="i-lucide-trash-2" class="size-4" />
          </button>
        </div>
      </TransitionGroup>

      <!-- Agregar regla -->
      <div class="space-y-2 p-4 rounded-lg bg-surface-low ghost-border">
        <UInput
          v-model="newRule.title"
          placeholder="Nombre de la regla..."
          size="sm"
          class="w-full"
          @keydown.enter.prevent="addRule"
        />
        <UInput
          v-model="newRule.description"
          placeholder="Descripción opcional..."
          size="sm"
          class="w-full"
        />
        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-lucide-plus"
            size="sm"
            variant="outline"
            label="Add Rule"
            class="rounded-full"
            :disabled="!newRule.title.trim()"
            @click="addRule"
          />
        </div>
      </div>
    </div>
  </UForm>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
