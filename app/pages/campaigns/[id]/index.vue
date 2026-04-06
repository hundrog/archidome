<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from "#imports"
import type { Database } from '@/types/database.types'
import { useCampaignStore } from '~/stores/campaign'

type CampaignWithProject = Database['public']['Tables']['campaigns']['Row'] & {
  projects?: { name: string }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const store = useCampaignStore()

const id = route.params.id as string

// ─── Fetch ────────────────────────────────────────────────────────────────────
const { data: campaign, pending } = await useAsyncData(
  `campaign-${id}`,
  async () => {
    await store.fetchCampaignById(id)
    // Still need to fetch with projects relation for this page
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, projects(name)")
      .eq("id", id)
      .single()

    if (error) throw error
    return data as CampaignWithProject
  },
)

// 404 si no existe
if (!campaign.value) {
  throw createError({ statusCode: 404, message: "Campaña no encontrada" })
}

// ─── ¿Es el dueño? ────────────────────────────────────────────────────────────
const isOwner = computed(
  () => !!user.value && user.value.sub === campaign.value?.user_id,
)

// ─── Eliminar ─────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)

async function deleteCampaign() {
  try {
    // Set current campaign for store
    if (campaign.value) {
      store.currentCampaign = campaign.value
    }

    await store.deleteCampaign(id)

    toast.add({ title: "Campaña eliminada", color: "success" })
    router.push("/campaigns")
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err.message,
      color: "error",
    })
  } finally {
    showDeleteModal.value = false
  }
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => campaign.value?.title ?? "Campaña",
  description: () => campaign.value?.description ?? "",
  ogImage: () => campaign.value?.image_url ?? undefined,
})

// protected image URL (solo https y de tu bucket):
const safeImageUrl = computed(() => {
  const url = campaign.value?.image_url
  if (!url) return null
  // Solo permite URLs de tu bucket de Supabase y https en general
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? url : null
  } catch {
    return null
  }
})
</script>

<template>
  <div class="min-h-screen bg-surface text-on-surface">
    <!-- ── Loading ── -->
    <div
      v-if="pending"
      class="w-full mx-auto px-4 py-12 space-y-6 animate-pulse"
    >
      <div class="h-72 rounded-2xl bg-gray-800" />
      <div class="h-8 bg-gray-800 rounded w-2/3" />
      <div class="h-4 bg-gray-800 rounded w-1/3" />
      <div class="space-y-2 pt-4">
        <div class="h-3 bg-gray-800 rounded w-full" />
        <div class="h-3 bg-gray-800 rounded w-5/6" />
        <div class="h-3 bg-gray-800 rounded w-4/6" />
      </div>
    </div>

    <template v-else-if="campaign">
      <!-- ── Hero imagen ── -->
      <section
      class="relative min-h-130 flex flex-col items-center justify-center px-4 overflow-hidden"
    >
      <!-- Fondo -->
      <div class="absolute inset-0 z-0">
        <img
          v-if="safeImageUrl"
          :src="safeImageUrl"
          :alt="campaign.title"
          class="w-full h-full object-cover"
        />
        <!-- Overlay oscuro -->
        <div class="absolute inset-0 bg-surface/60" />
        <!-- Gradiente hacia abajo -->
        <div class="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-surface to-transparent" />
        <!-- Botón volver -->
        <div class="absolute top-4 left-4 lg:top-12 lg:left-12">
          <UButton
            icon="i-lucide-chevron-left"
            to="/campaigns"
            size="xl"
            color="neutral"
            variant="subtle"
            class="rounded-full z-10"
          />
        </div>

        <!-- Acciones dueño -->
        <div v-if="isOwner" class="absolute bottom-4 right-4 lg:bottom-12 lg:right-12 flex gap-2">
          <UButton
            :to="`/campaigns/${id}/edit`"
            icon="i-lucide-pencil"
            size="xl"
            variant="ghost"
            color="primary"
            class="rounded-full z-10"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xl"
            variant="ghost"
            color="error"
            class="rounded-full z-10"
            @click="showDeleteModal = true"
          />
        </div>
      </div>
      <!-- Título + badges -->
       <div class="absolute bottom-4 left-4 flex flex-col">
         <div class="space-y-3">
           <div class="flex flex-wrap gap-2 items-center">
             <UBadge
              color="primary"
              variant="subtle"
              :label="campaign.system"
             />
           </div>
   
           <h1 class="text-3xl sm:text-4xl font-bold text-white leading-tight">
             {{ campaign.title }}
           </h1>
   
           <p
             class="text-primary-400 font-medium uppercase tracking-widest text-sm"
           >
             {{ campaign.description }}
           </p>
         </div>
       </div>
      </section>

      <!-- ── Contenido ── -->
      <div class="grid grid-cols-4 gap-1 lg:gap-8">
      <div class="col-span-3">
      </div>
      <div class="col-span-1">
        <div class="card p-4 lg:p-6">
          <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Scheduling
          </h4>

        </div>
      </div>
      </div>
    </template>

    <!-- ── Modal confirmar eliminar ── -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-full bg-red-500/10">
              <UIcon
                name="i-lucide-triangle-alert"
                class="size-5 text-red-400"
              />
            </div>
            <h3 class="text-lg font-semibold text-white">Eliminar campaña</h3>
          </div>
          <p class="text-gray-400 text-sm">
            ¿Estás seguro de que quieres eliminar
            <span class="text-white font-medium">{{ campaign?.title }}</span
            >? Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              variant="ghost"
              label="Cancelar"
              @click="showDeleteModal = false"
            />
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              label="Eliminar"
              :loading="store.loading"
              @click="deleteCampaign"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
