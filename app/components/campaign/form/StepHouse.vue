// components/campaign/form/StepHouse.vue
<script setup lang="ts">
const campaignStore = useCampaignStore()

const supabase = useSupabaseClient()
const user     = useSupabaseUser()

// ─── Proyectos ────────────────────────────────────────────────────────────────
const { data: projects } = await useAsyncData('projects-form', async () => {
  const { data } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.value!.id)
  return data ?? []
})

const projectOptions = computed(() =>
  (projects.value ?? []).map((p: any) => ({ label: p.name, value: p.id }))
)

// ─── Resumen ──────────────────────────────────────────────────────────────────
const playModeLabel: Record<string, string> = {
  remote:    'Remoto',
  in_person: 'Presencial',
  hybrid:    'Híbrido'
}

const platformLabel: Record<string, string> = {
  discord:             'Discord',
  roll20:              'Roll20',
  foundry:             'Foundry VTT',
  google_meet:         'Google Meet',
  tabletop_simulator:  'Tabletop Simulator',
  other:               'Otro'
}

const frequencyLabel: Record<string, string> = {
  weekly:    'Semanal',
  biweekly:  'Quincenal',
  monthly:   'Mensual',
  irregular: 'Irregular'
}

const summaryItems = computed(() => [
  { icon: 'i-lucide-scroll',      label: 'Sistema',    value: campaignStore.form.system },
  { icon: 'i-lucide-monitor',     label: 'Modo',       value: campaignStore.form.play_mode ? playModeLabel[campaignStore.form.play_mode] : '—' },
  { icon: 'i-lucide-users',       label: 'Jugadores',  value: `${campaignStore.form.max_players} máximo` },
  { icon: 'i-lucide-swords',      label: 'Nivel',      value: `Nivel ${campaignStore.form.start_level}` },
  { icon: 'i-lucide-calendar',    label: 'Frecuencia', value: campaignStore.form.frequency ? frequencyLabel[campaignStore.form.frequency] : '—' },
  { icon: 'i-lucide-globe',       label: 'Idioma',     value: campaignStore.form.language },
  { icon: 'i-lucide-layout-grid', label: 'Plataforma', value: campaignStore.form.virtual_platform ? platformLabel[campaignStore.form.virtual_platform] : '—' },
].filter(i => i.value && i.value !== '—'))
</script>

<template>
  <div class="space-y-8">

    <!-- ── Resumen ── -->
    <div class="space-y-4">
      <h3 class="label-metadata text-on-surface-dim">Resumen de la campaña</h3>

      <div class="p-5 rounded-xl bg-surface-low space-y-4">
        <!-- Título y hook -->
        <div>
          <h2 class="font-display text-headline-sm text-on-surface">{{ campaignStore.form.title || 'Sin título' }}</h2>
          <p class="font-body text-body-sm text-on-surface-dim mt-1 line-clamp-2">
            {{ campaignStore.form.hook || 'Sin hook definido' }}
          </p>
        </div>

        <!-- Tags -->
        <div v-if="campaignStore?.form?.style_tags?.length" class="flex flex-wrap gap-1.5">
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

        <!-- Stats grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="item in summaryItems"
            :key="item.label"
            class="flex items-center gap-2"
          >
            <UIcon :name="item.icon" class="size-3.5 text-primary shrink-0" />
            <div>
              <p class="label-metadata" style="font-size: 0.6rem;">{{ item.label }}</p>
              <p class="font-body text-label-sm text-on-surface">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <USeparator />

    <!-- ── Imagen ── -->
    <div class="space-y-2">
      <h3 class="label-metadata text-on-surface-dim">Imagen de portada</h3>
      <CampaignImageField
        :initial-url="campaignStore.imagePreview"
        @update="({ file, removed }) => {
          if (removed) campaignStore.removeImage()
          else campaignStore.setImage(file)
        }"
      />
    </div>

    <USeparator />

    <!-- ── Proyecto ── -->
    <UFormField
      label="Proyecto"
      name="project_id"
      required
      hint="Agrupa tus campañas bajo un proyecto"
    >
      <USelectMenu
        v-model="campaignStore.form.project_id"
        :items="projectOptions"
        value-key="value"
        label-key="label"
        placeholder="Selecciona un proyecto"
        size="lg"
        class="w-full"
      />
    </UFormField>

  </div>
</template>