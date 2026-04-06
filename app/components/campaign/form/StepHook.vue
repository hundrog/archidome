<!-- components/campaign/form/StepHook.vue -->
<script setup lang="ts">
import { hookSchema } from '@/schemas/campaign';

const campaignStore = useCampaignStore()

const hookLength = computed(() => campaignStore.form.hook?.length ?? 0)
const descLength = computed(() => campaignStore.form.description?.length ?? 0)

// Sistemas populares para sugerencias
const systemSuggestions = [
  'Dungeons & Dragons 5e',
  'Pathfinder 2e',
  'Fabula Ultima',
  'Call of Cthulhu',
  'Vampire: The Masquerade',
  'Blades in the Dark',
  'Ironsworn',
  'Savage Worlds',
  'Mothership',
  'Trophy Gold',
]

const showSuggestions  = ref(false)
const filteredSystems  = computed(() =>
  state.system
    ? systemSuggestions.filter(s => s.toLowerCase().includes(state.system.toLowerCase()))
    : systemSuggestions
)

function selectSystem(system: string) {
  campaignStore.form.system = system
  showSuggestions.value = false
}

async function onBlur() {
    setTimeout(() => showSuggestions.value = false, 150)
}
</script>

<template>
  <UForm :schema="hookSchema" :state="campaignStore.form" class="space-y-6">

    <!-- Título -->
    <UFormField
      label="Título de la campaña"
      name="title"
      required
      hint="El nombre que verán los jugadores"
    >
      <UInput
        v-model="campaignStore.form.title"
        placeholder="Ej: Las Crónicas de Valdris"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Sistema -->
    <UFormField
      label="Sistema de juego"
      name="system"
      required
    >
      <div class="relative">
        <UInput
          v-model="campaignStore.form.system"
          placeholder="Ej: Dungeons & Dragons 5e"
          size="lg"
          class="w-full"
          autocomplete="off"
          @focus="showSuggestions = true"
          @blur="onBlur"
        />
        <!-- Sugerencias -->
        <Transition name="fade">
          <div
            v-if="showSuggestions && filteredSystems.length"
            class="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg
                   bg-surface-high ghost-border shadow-ambient overflow-hidden"
          >
            <button
              v-for="s in filteredSystems.slice(0, 6)"
              :key="s"
              class="w-full text-left px-4 py-2.5 font-body text-body-sm text-on-surface
                     hover:bg-surface-bright transition-colors"
              @mousedown="selectSystem(s)"
            >
              {{ s }}
            </button>
          </div>
        </Transition>
      </div>
    </UFormField>

    <!-- Hook -->
    <UFormField
      label="The Hook"
      name="hook"
      required
      :hint="`${hookLength}/300 — El gancho que atrae a los jugadores`"
    >
      <UTextarea
        v-model="campaignStore.form.hook"
        placeholder="Describe la premisa central, el conflicto inmediato o la leyenda que une al grupo..."
        :rows="3"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <!-- Descripción / Lore -->
    <UFormField
      label="World Lore & Descripción"
      name="description"
      :hint="`${descLength}/5000 — Detalla la atmósfera, el mundo y la trama`"
    >
      <UTextarea
        v-model="campaignStore.form.description"
        placeholder="Describe la atmósfera, la amenaza inmediata, o la leyenda que une al grupo..."
        :rows="8"
        size="lg"
        class="w-full"
      />
    </UFormField>

  </UForm>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>