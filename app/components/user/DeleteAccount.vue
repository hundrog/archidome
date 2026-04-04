<script setup lang="ts">
// components/user/DeleteAccount.vue
const supabase = useSupabaseClient()
const router   = useRouter()
const toast    = useToast()

const showModal  = ref(false)
const deleting   = ref(false)
const confirm    = ref('')

// El usuario debe escribir "ELIMINAR" para confirmar
const CONFIRM_WORD = 'ELIMINAR'
const canDelete    = computed(() => confirm.value === CONFIRM_WORD)

async function deleteAccount() {
  if (!canDelete.value) return
  deleting.value = true

  try {
    // Llama a la función de Postgres que borra auth.users en cascada
    const { error } = await supabase.rpc('delete_user')
    if (error) throw error

    // Cierra la sesión localmente
    await supabase.auth.signOut()

    toast.add({
      title:       'Cuenta eliminada',
      description: 'Todos tus datos han sido eliminados.',
      color:       'success'
    })

    router.push('/')
  } catch (err: any) {
    toast.add({ title: 'Error al eliminar', description: err.message, color: 'error' })
  } finally {
    deleting.value = false
    showModal.value = false
  }
}

function openModal() {
  confirm.value  = ''
  showModal.value = true
}
</script>

<template>
  <div class="rounded-xl border border-red-900/40 bg-red-950/20 p-5 space-y-3">
    <div>
      <h3 class="text-sm font-semibold text-red-400">Zona de peligro</h3>
      <p class="text-xs text-gray-500 mt-1">
        Eliminar tu cuenta borrará permanentemente todos tus proyectos, campañas y datos.
        Esta acción no se puede deshacer.
      </p>
    </div>
    <UButton
      color="error"
      variant="outline"
      icon="i-lucide-trash-2"
      label="Eliminar mi cuenta"
      size="sm"
      @click="openModal"
    />
  </div>

  <!-- Modal de confirmación -->
  <UModal v-model:open="showModal">
    <template #content>
      <div class="p-6 space-y-5">

        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-red-500/10 shrink-0">
            <UIcon name="i-lucide-triangle-alert" class="size-5 text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">Eliminar cuenta</h3>
            <p class="text-xs text-gray-500">Esta acción es permanente e irreversible</p>
          </div>
        </div>

        <!-- Advertencia -->
        <div class="rounded-lg bg-red-950/30 border border-red-900/40 p-4 space-y-2">
          <p class="text-sm text-red-300 font-medium">Se eliminará permanentemente:</p>
          <ul class="text-xs text-gray-400 space-y-1">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" /> Tu perfil y datos de contacto
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" /> Todos tus proyectos
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" /> Todas tus campañas e imágenes
            </li>
          </ul>
        </div>

        <!-- Confirmación por texto -->
        <div class="space-y-2">
          <p class="text-sm text-gray-400">
            Escribe <span class="font-mono font-bold text-red-400">{{ CONFIRM_WORD }}</span> para confirmar
          </p>
          <UInput
            v-model="confirm"
            :placeholder="CONFIRM_WORD"
            size="lg"
            class="w-full font-mono"
            autofocus
          />
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 pt-1">
          <UButton
            variant="ghost"
            label="Cancelar"
            @click="showModal = false"
          />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Eliminar permanentemente"
            :loading="deleting"
            :disabled="!canDelete"
            @click="deleteAccount"
          />
        </div>

      </div>
    </template>
  </UModal>
</template>