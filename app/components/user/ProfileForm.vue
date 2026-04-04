<script setup lang="ts">
// components/user/ProfileForm.vue
// ─── Schema ───────────────────────────────────────────────────────────────────
import { profileSchema } from '@/schemas/profile'
import type { ProfileForm } from '@/schemas/profile'

// ─── Setup ────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient()
const user     = useSupabaseUser()
const toast    = useToast()
const loading  = ref(false)

console.log('User in ProfileForm:', user.value)
// ─── Cargar perfil ────────────────────────────────────────────────────────────
const { data: profile } = await useAsyncData('profile', async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value!.sub)
    .single()

  if (error) throw error
  return data
})

// ─── Estado ───────────────────────────────────────────────────────────────────
const state = reactive<Partial<ProfileForm>>({
  full_name: profile.value?.full_name  ?? '',
  username:  profile.value?.username   ?? '',
  bio:       profile.value?.bio        ?? '',
  discord:   profile.value?.discord    ?? '',
  whatsapp:  profile.value?.whatsapp   ?? '',
  twitter:   profile.value?.twitter    ?? '',
  instagram: profile.value?.instagram  ?? '',
  website:   profile.value?.website    ?? ''
})

const bioLength = computed(() => state.bio?.length ?? 0)

// ─── Submit ───────────────────────────────────────────────────────────────────
async function onSubmit() {
  loading.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  state.full_name,
        username:   state.username   || null,
        bio:        state.bio        || null,
        discord:    state.discord    || null,
        whatsapp:   state.whatsapp   || null,
        twitter:    state.twitter    || null,
        instagram:  state.instagram  || null,
        website:    state.website    || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.value!.id)

    if (error) throw error

    toast.add({ title: 'Perfil actualizado', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="profileSchema" :state="state" class="space-y-8" @submit="onSubmit">

    <!-- ── Datos básicos ── -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Datos básicos
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Nombre" name="full_name" required>
          <UInput
            v-model="state.full_name"
            placeholder="Tu nombre"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Username" name="username" hint="Solo letras, números y _">
          <UInput
            v-model="state.username"
            placeholder="tu_username"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <span class="text-gray-500 text-sm">@</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField label="Bio" name="bio" :hint="`${bioLength}/300`">
        <UTextarea
          v-model="state.bio"
          placeholder="Cuéntanos un poco de ti..."
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <USeparator />

    <!-- ── Contacto ── -->
    <div class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Contacto
        </h3>
        <p class="text-xs text-gray-600 mt-1">
          Solo llena los que quieras mostrar a otros jugadores
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <UFormField label="Discord" name="discord">
          <UInput
            v-model="state.discord"
            placeholder="usuario#0000 o usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-simple-icons-discord" class="size-4 text-indigo-400" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="WhatsApp" name="whatsapp">
          <UInput
            v-model="state.whatsapp"
            placeholder="+52 33 1234 5678"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-simple-icons-whatsapp" class="size-4 text-green-400" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Twitter / X" name="twitter">
          <UInput
            v-model="state.twitter"
            placeholder="tu_usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <span class="text-gray-500 text-sm">@</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Instagram" name="instagram">
          <UInput
            v-model="state.instagram"
            placeholder="tu_usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <span class="text-gray-500 text-sm">@</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Sitio web" name="website" class="sm:col-span-2">
          <UInput
            v-model="state.website"
            placeholder="https://tuwebsite.com"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-lucide-globe" class="size-4 text-gray-400" />
            </template>
          </UInput>
        </UFormField>

      </div>
    </div>

    <!-- ── Guardar ── -->
    <div class="flex justify-end">
      <UButton
        type="submit"
        size="lg"
        :loading="loading"
        icon="i-lucide-save"
        label="Guardar cambios"
      />
    </div>

  </UForm>
</template>