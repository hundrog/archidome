<!-- components/campaign/form/StepPortal.vue -->
<script setup lang="ts">
import { portalSchema } from '@/schemas/campaign';

const campaignStore = useCampaignStore()

// ─── Opciones ─────────────────────────────────────────────────────────────────
const playModeOptions = [
  { label: 'Remoto',     value: 'remote',     icon: 'i-lucide-monitor',  description: 'Sesiones 100% en línea' },
  { label: 'Presencial', value: 'in_person',  icon: 'i-lucide-users',    description: 'Nos vemos en persona' },
  { label: 'Híbrido',    value: 'hybrid',     icon: 'i-lucide-shuffle',  description: 'Combinación de ambos' },
]

const platformOptions = [
  { label: 'Discord',              value: 'discord',              icon: 'i-simple-icons-discord' },
  { label: 'Roll20',               value: 'roll20',               icon: 'i-simple-icons-roll20' },
  { label: 'Foundry VTT',          value: 'foundry',              icon: 'i-lucide-castle' },
  { label: 'Google Meet',          value: 'google_meet',          icon: 'i-simple-icons-googlemeet' },
  { label: 'Tabletop Simulator',   value: 'tabletop_simulator',   icon: 'i-lucide-box' },
  { label: 'Otro',                 value: 'other',                icon: 'i-lucide-more-horizontal' },
]

const frequencyOptions = [
  { label: 'Semanal',    value: 'weekly' },
  { label: 'Quincenal',  value: 'biweekly' },
  { label: 'Mensual',    value: 'monthly' },
  { label: 'Irregular',  value: 'irregular' },
]

const durationOptions = [
  { label: '1-2 horas',  value: '1-2 horas' },
  { label: '2-3 horas',  value: '2-3 horas' },
  { label: '3-4 horas',  value: '3-4 horas' },
  { label: '4+ horas',   value: '4+ horas' },
]

const timezoneOptions = [
  { label: 'UTC-8 (PST)', value: 'UTC-8' },
  { label: 'UTC-7 (MST)', value: 'UTC-7' },
  { label: 'UTC-6 (CST)', value: 'UTC-6' },
  { label: 'UTC-5 (EST)', value: 'UTC-5' },
  { label: 'UTC-4',       value: 'UTC-4' },
  { label: 'UTC+0',       value: 'UTC+0' },
  { label: 'UTC+1',       value: 'UTC+1' },
  { label: 'UTC+2',       value: 'UTC+2' },
]

// Solo mostrar plataforma y ubicación según modo
const showPlatform = computed(() =>
  campaignStore.form.play_mode === 'remote' || campaignStore.form.play_mode === 'hybrid'
)
const showLocation = computed(() =>
  campaignStore.form.play_mode === 'in_person' || campaignStore.form.play_mode === 'hybrid'
)

</script>

<template>
  <UForm :schema="portalSchema" :state="campaignStore.form" class="space-y-8">

    <!-- Modo de juego -->
    <UFormField label="Game Format" name="play_mode" required>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
        <button
          v-for="opt in playModeOptions"
          :key="opt.value"
          type="button"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
          :class="campaignStore.form.play_mode === opt.value
            ? 'bg-primary/20 ghost-border border-primary/40 text-on-surface'
            : 'bg-surface-high text-on-surface-dim hover:bg-surface-bright'"
          :style="campaignStore.form.play_mode === opt.value ? { borderColor: 'rgba(159,167,255,0.4)' } : {}"
          @click="campaignStore.form.play_mode = opt.value as any"
        >
          <div
            class="size-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
            :class="campaignStore.form.play_mode === opt.value ? 'bg-primary/20' : 'bg-surface-variant'"
          >
            <UIcon :name="opt.icon" class="size-4" :class="campaignStore.form.play_mode === opt.value ? 'text-primary' : 'text-on-surface-dim'" />
          </div>
          <div>
            <p class="font-body font-medium text-body-sm" :class="campaignStore.form.play_mode === opt.value ? 'text-on-surface' : 'text-on-surface-dim'">
              {{ opt.label }}
            </p>
            <p class="font-body text-label-sm text-on-surface-dim">{{ opt.description }}</p>
          </div>
          <!-- Check -->
          <UIcon
            v-if="campaignStore.form.play_mode === opt.value"
            name="i-lucide-check-circle"
            class="size-4 text-primary ml-auto shrink-0"
          />
        </button>
      </div>
    </UFormField>

    <!-- Plataforma virtual -->
    <Transition name="fade">
      <UFormField v-if="showPlatform" label="Virtual Tabletop Platform" name="virtual_platform">
        <USelectMenu
          v-model="campaignStore.form.virtual_platform"
          :items="platformOptions"
          value-key="value"
          label-key="label"
          placeholder="Selecciona una plataforma"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </Transition>

    <!-- Ubicación -->
    <Transition name="fade">
      <CampaignLocationField
        v-if="showLocation"
        :initial-location="campaignStore.form.location_name"
        :initial-coords="campaignStore.form.lat && campaignStore.form.lng ? { lat: campaignStore.form.lat, lng: campaignStore.form.lng } : null"
        @update="(data) => campaignStore.setLocation(data.locationName, data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null)"
      />
    </Transition>

    <USeparator />

    <!-- Scheduling -->
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">Scheduling</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Frecuencia -->
        <UFormField label="Frequency" name="frequency">
          <USelectMenu
            v-model="campaignStore.form.frequency"
            :items="frequencyOptions"
            value-key="value"
            label-key="label"
            placeholder="Frecuencia"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Idioma -->
        <UFormField label="Language" name="language">
          <UInput
            v-model="campaignStore.form.language"
            placeholder="Español"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Timezone -->
        <UFormField label="Timezone" name="timezone">
          <USelectMenu
            v-model="campaignStore.form.timezone"
            :items="timezoneOptions"
            value-key="value"
            label-key="label"
            placeholder="UTC-6 (CST)"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Duración -->
        <UFormField label="Duration" name="duration">
          <USelectMenu
            v-model="campaignStore.form.duration"
            :items="durationOptions"
            value-key="value"
            label-key="label"
            placeholder="3-4 horas"
            size="lg"
            class="w-full"
          />
        </UFormField>

      </div>
    </div>

  </UForm>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>