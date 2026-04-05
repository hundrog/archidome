<script setup lang="ts">
// components/campaign/SearchBar.vue

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

const modeOptions = [
  { label: "Todos los modos", value: null },
  { label: "Remoto", value: "remote" },
  { label: "Presencial", value: "in_person" },
  { label: "Híbrido", value: "hybrid" },
];

const radiusOptions = [
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "200 km", value: 200 },
];

function onModeChange(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  emit('update:mode', val === '' ? null : val)
}

function onSearchInput(event: Event) {
  emit('update:search', (event.target as HTMLInputElement).value)
}

function onRadiusChange(event: Event) {
  emit('update:radius', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="max-w-7xl mx-auto mb-8">
    <!-- ── Contenedor glass ── -->
    <div
      class="glass ghost-border rounded-xl p-1.5 flex flex-col sm:flex-row items-stretch gap-1"
    >
      <!-- Búsqueda por texto -->
      <div class="flex items-center gap-3 flex-1 px-4 py-2">
        <UIcon
          name="i-lucide-search"
          class="size-4 shrink-0 text-on-surface-dim"
        />
        <input
          :value="search"
          type="text"
          placeholder="Sistema, título, trama…"
          class="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-dim text-body-md outline-none font-body"
          @input="onSearchInput"
        />
      </div>

      <!-- Divisor -->
      <div class="hidden sm:block w-px bg-outline-variant/20 my-2" />

      <!-- Modo de juego -->
      <div class="flex items-center gap-3 px-4 py-2 sm:w-52">
        <UIcon
          name="i-lucide-layout-grid"
          class="size-4 shrink-0 text-on-surface-dim"
        />
        <select
          :value="mode ?? ''"
          class="flex-1 bg-transparent text-on-surface text-body-md outline-none font-body cursor-pointer appearance-none"
          @change="onModeChange"
        >
          <option
            v-for="opt in modeOptions"
            :key="String(opt.value)"
            :value="opt.value ?? ''"
            class="bg-surface-high text-on-surface"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Divisor -->
      <div class="hidden sm:block w-px bg-outline-variant/20 my-2" />

      <!-- Cercanía -->
      <div class="flex items-center gap-3 px-4 py-2 sm:w-44">
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
          <span v-if="geoLoading">Buscando…</span>
          <span v-else-if="nearby">Cerca de mí</span>
          <span v-else>Cualquier lugar</span>
        </button>

        <!-- Radio selector cuando está activo -->
        <Transition name="fade">
          <select
            v-if="nearby"
            :value="radius"
            class="bg-transparent text-primary text-label-md outline-none font-body cursor-pointer appearance-none"
            @change="onRadiusChange"
          >
            <option
              v-for="opt in radiusOptions"
              :key="opt.value"
              :value="opt.value"
              class="bg-surface-high text-on-surface"
            >
              {{ opt.label }}
            </option>
          </select>
        </Transition>
      </div>

      <!-- CTA Buscar -->
      <button
        class="gradient-primary text-white font-body font-medium text-body-md rounded-lg px-6 py-2.5 shrink-0 transition-transform active:scale-[0.98] flex items-center gap-2 justify-center"
        @click="emit('toggleNearby')"
      >
        <UIcon name="i-lucide-compass" class="size-4" />
        Explorar
      </button>
    </div>

    <!-- Error geo -->
    <p v-if="geoError && !hasCoords" class="text-xs text-error mt-2 px-2">
      {{ geoError }}
    </p>

    <!-- Hint cercanía activa -->
    <p v-if="nearby && hasCoords" class="text-xs text-on-surface-dim mt-2 px-2">
      Presenciales e híbridas a menos de {{ radius }} km · Las remotas siempre
      aparecen
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
