<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const baseItems = [
  {
    to: "https://www.buymeacoffee.com/rollatable",
    target: "_blank",
    label: "Buy me a coffee",
    slot: "logo",
    class:
      "font-cookie text-lg bg-yellow-400 text-gray-900 rounded-full hover:text-yellow-900 transition-colors duration-200 px-3 py-1",
  },
  {
    label: "Crear campaña",
    to: "/campaigns/new",
    icon: "i-lucide-plus",
    auth: false,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: "i-lucide-settings",
    auth: true,
  },
];

const items = computed<NavigationMenuItem[]>(() => [
baseItems
    .filter(item => !item.auth || !!user.value)
    .map(({ auth, ...item }) => ({
      ...item,
      active: route.path === item.to
    }))
]);

const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/campaigns");
};
</script>

<template>
  <UApp>
    <UHeader transparent>
      <template #title>
        <div class="logo-text logo-image inline-flex items-center gap-2 font-display text-xl text-on-surface">
        <img
          src="/arcane-logo.png"
          alt="Rollatable"
          class="h-8 w-auto"
        />
        <p>Arkana</p>
          </div>
      </template>

      <UNavigationMenu :items="items" :ui="{ list: 'gap-2' }">
        <template #logo="{ item }">
          <img
            src="/bmc-logo-no-background.png"
            alt="Rollatable"
            class="h-4 w-auto"
          />
          <span>{{ (item as NavigationMenuItem).label }}</span>
        </template>
      </UNavigationMenu>

      <template #right>
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
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain class="max-w-7xl m-auto">
      <slot />
    </UMain>

    <UFooter />
  </UApp>
</template>
