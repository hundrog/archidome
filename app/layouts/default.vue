<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Figma',
  to: 'https://go.nuxt.com/figma-ui',
  target: '_blank'
}, {
  label: 'Releases',
  to: 'https://github.com/nuxt/ui/releases',
  target: '_blank'
}])

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <Logo class="h-6 w-auto" />
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          aria-label="Logout"
          label="Logout"
          v-if="user"
          @click="logout"
        />

        <UButton
          color="neutral"
          variant="ghost"
          to="/login"
          icon="i-lucide-log-in"
          aria-label="Login"
          label="Login"
          v-else
        />
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain class="max-w-screen-2xl m-auto p-4">
      <slot />
    </UMain>

    <UFooter />
  </UApp>
</template>
