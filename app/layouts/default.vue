<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const footerItems = [
  {
    to: "/privacy",
    label: "Privacy Policy",
    icon: "i-lucide-shield",
    auth: false,
  },{
    to: "/terms",
    label: "Terms of Service",
    icon: "i-lucide-file-text",
    auth: false,
  },
  {
    to: "buymeacoffee.com/the.blue.pixel",
    target: "_blank",
    label: "Buy me a coffee",
    icon: "i-simple-icons-buymeacoffee",
    auth: false,
  },
];

const baseItems = [
  {
    to: "buymeacoffee.com/the.blue.pixel",
    target: "_blank",
    label: "Buy me a coffee",
    icon: "i-simple-icons-buymeacoffee",
    auth: false,
  },
  {
    label: "Crear campaña",
    to: "/campaigns/new",
    icon: "i-lucide-plus",
    auth: false,
  },
  {
    label: "Proyectos",
    to: "/projects",
    icon: "i-lucide-folder",
    auth: true,
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
    .filter((item) => !item.auth || !!user.value)
    .map(({ auth, ...item }) => ({
      ...item,
      active: route.path === item.to,
    })),
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
        <div
          class="logo-text logo-image inline-flex items-center gap-2 font-display text-xl text-on-surface"
        >
          <img src="/arcane-logo.png" alt="Rollatable" class="h-8 w-auto" />
          <p>The Archidome</p>
        </div>
      </template>

      <UNavigationMenu :items="items" :ui="{ list: 'gap-2' }" />

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

<UFooter>
    <template #left>
      <p class="text-muted text-sm">Copyright © {{ new Date().getFullYear() }}</p>
    </template>
    
    <template #right>
      <UNavigationMenu :items="footerItems" variant="link" orientation="vertical" />
    </template>
  </UFooter>
  </UApp>
</template>
