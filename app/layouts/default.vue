<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const user = useSupabaseUser();
const supabase = useSupabaseClient();
const { t } = useI18n();

const footerItems = computed(() => [
  {
    to: "/privacy",
    label: t("layout.privacyPolicy"),
    icon: "i-lucide-shield",
    auth: false,
  },
  {
    to: "/terms",
    label: t("layout.termsOfService"),
    icon: "i-lucide-file-text",
    auth: false,
  },
  {
    to: "https://www.buymeacoffee.com/the.blue.pixel",
    target: "_blank",
    rel: "noopener noreferrer",
    label: t("layout.buyMeACoffee"),
    icon: "i-simple-icons-buymeacoffee",
    auth: false,
  },
]);

const baseItems = computed(() => [
  {
    to: "https://www.buymeacoffee.com/the.blue.pixel",
    target: "_blank",
    rel: "noopener noreferrer",
    label: t("layout.buyMeACoffee"),
    icon: "i-simple-icons-buymeacoffee",
    auth: false,
  },
  {
    label: t("layout.createCampaign"),
    to: "/campaigns/new",
    icon: "i-lucide-plus",
    auth: false,
  },
  {
    label: t("layout.projects"),
    to: "/projects",
    icon: "i-lucide-folder",
    auth: true,
  },
]);

const items = computed<NavigationMenuItem[]>(() => [
  baseItems.value
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
          <img
            src="/arcane-logo.png"
            :alt="$t('brand.logoAlt')"
            class="h-8 w-auto"
          />
          <p>{{ $t("brand.name") }}</p>
        </div>
      </template>

      <UNavigationMenu :items="items" :ui="{ list: 'gap-2' }" />

      <template #right>
        <LayoutOptions :t="t" />
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
        <p class="text-muted text-sm">
          {{ $t("layout.copyright", { year: new Date().getFullYear() }) }}
        </p>
      </template>

      <template #right>
        <UNavigationMenu :items="footerItems" variant="link" orientation="vertical" />
      </template>
    </UFooter>
  </UApp>
</template>
