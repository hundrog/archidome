<!-- pages/campaigns/new.vue -->
<script setup lang="ts">
const supabase = useSupabaseClient()
const user     = useSupabaseUser()
const toast    = useToast()
const router   = useRouter()

// ─── Estado del formulario ────────────────────────────────────────────────────
const campaignStore = useCampaignStore()

// ─── Imagen ───────────────────────────────────────────────────────────────────


// ─── Tabs ─────────────────────────────────────────────────────────────────────
const currentTab = ref('hook')

const tabs = [
  { label: '01 Hook',   slot: 'hook',   icon: 'i-lucide-book-open' },
  { label: '02 Portal', slot: 'portal', icon: 'i-lucide-compass' },
  { label: '03 Rules',  slot: 'rules',  icon: 'i-lucide-scroll' },
  { label: '04 House',  slot: 'house',  icon: 'i-lucide-home' },
]

// Validación por tab antes de avanzar
function validateCurrentTab(): boolean {
  if (currentTab.value === 'hook') {
    if (!campaignStore.form.title || campaignStore.form.title.length < 3) {
      toast.add({ title: 'Faltan datos', description: 'El título debe tener al menos 3 caracteres', color: 'warning' })
      return false
    }
    if (!campaignStore.form.system || campaignStore.form.system.length < 2) {
      toast.add({ title: 'Faltan datos', description: 'Especifica el sistema de juego', color: 'warning' })
      return false
    }
    if (!campaignStore.form.hook || campaignStore.form.hook.length < 10) {
      toast.add({ title: 'Faltan datos', description: 'El hook debe tener al menos 10 caracteres', color: 'warning' })
      return false
    }
  }
  if (currentTab.value === 'house') {
    if (!campaignStore.form.project_id) {
      toast.add({ title: 'Faltan datos', description: 'Selecciona un proyecto', color: 'warning' })
      return false
    }
  }
  return true
}

function nextTab() {
  if (!validateCurrentTab()) return
  const idx = tabs.findIndex(t => t.slot === currentTab.value)
  if (idx < tabs.length - 1) currentTab.value = tabs[idx + 1].slot
}

function prevTab() {
  const idx = tabs.findIndex(t => t.slot === currentTab.value)
  if (idx > 0) currentTab.value = tabs[idx - 1].slot
}

const isLastTab  = computed(() => currentTab.value === 'house')
const isFirstTab = computed(() => currentTab.value === 'hook')

// ─── Subida de imagen ─────────────────────────────────────────────────────────


// ─── Submit ───────────────────────────────────────────────────────────────────
const loading = ref(false)

async function onSubmit() {
  if (!validateCurrentTab()) return
  loading.value = true

  try {
    let imageUrl: string | null = null
    if (campaignStore.imageFile) imageUrl = await campaignStore.uploadImage(campaignStore.imageFile)

    const payload = {
      title:            campaignStore.form.title,
      system:           campaignStore.form.system,
      hook:             campaignStore.form.hook,
      description:      campaignStore.form.description,
      play_mode:        campaignStore.form.play_mode,
      virtual_platform: campaignStore.form.virtual_platform,
      frequency:        campaignStore.form.frequency,
      language:         campaignStore.form.language,
      timezone:         campaignStore.form.timezone,
      duration:         campaignStore.form.duration,
      location_name:    campaignStore.form.location_name,
      lat:              campaignStore.form.lat,
      lng:              campaignStore.form.lng,
      max_players:      campaignStore.form.max_players,
      start_level:      campaignStore.form.start_level,
      style_tags:       campaignStore.form.style_tags,
      house_rules:      campaignStore.form.house_rules,
      project_id:       campaignStore.form.project_id,
      image_url:        imageUrl,
      user_id:          user.value!.id,
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)

    toast.add({ title: '¡Campaña creada!', description: `"${campaignStore.form.title}" fue publicada.`, color: 'success' })
    campaignStore.resetForm()
    router.push(`/campaigns/${data.id}`)
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-4 py-10 space-y-8">

      <!-- ── Encabezado ── -->
      <div>
        <NuxtLink
          to="/campaigns"
          class="inline-flex items-center gap-2 font-body text-label-sm text-on-surface-dim
                 hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver a campañas
        </NuxtLink>
        <h1 class="font-display text-display-sm text-on-surface">Forge Your Tale</h1>
        <p class="font-body text-body-sm text-on-surface-dim mt-1">
          Los reinos esperan. Define el camino y convoca a los héroes.
        </p>
      </div>

      <!-- ── Tabs ── -->
      <UTabs
        v-model:model-value="currentTab"
        :items="tabs"
        variant="link"
        :ui="{ list: 'border-b border-outline-variant/20' }"
      >
        <!-- Hook -->
        <template #hook>
          <div class="pt-8">
            <CampaignFormStepHook />
          </div>
        </template>

        <!-- Portal -->
        <template #portal>
          <div class="pt-8">
            <CampaignFormStepPortal />
          </div>
        </template>

        <!-- Rules -->
        <template #rules>
          <div class="pt-8">
            <CampaignFormStepRules />
          </div>
        </template>

        <!-- House -->
        <template #house>
          <div class="pt-8">
            <CampaignFormStepHouse />
          </div>
        </template>

      </UTabs>

      <!-- ── Navegación ── -->
      <div class="flex items-center justify-between pt-4 border-t border-outline-variant/20">
        <UButton
          v-if="!isFirstTab"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Anterior"
          class="rounded-full"
          @click="prevTab"
        />
        <div v-else />

        <UButton
          v-if="!isLastTab"
          icon="i-lucide-arrow-right"
          trailing
          label="Siguiente"
          class="gradient-primary rounded-full text-white"
          @click="nextTab"
        />
        <UButton
          v-else
          icon="i-lucide-sparkles"
          trailing
          label="Manifest Adventure"
          class="gradient-primary rounded-full text-white"
          :loading="loading"
          @click="onSubmit"
        />
      </div>

    </div>
  </div>
</template>