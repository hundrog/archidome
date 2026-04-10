<script setup lang="ts">
const user = useSupabaseUser();
const avatarStore = useAvatarStore();
import type { DropdownMenuItem } from "@nuxt/ui";
const { locales, setLocale } = useI18n();
const { t } = useI18n();

const logout = async () => {
  await useSupabaseClient().auth.signOut();
  avatarStore.reset();
  navigateTo("/campaigns");
};

const localeItems = computed(() => {
  return locales.value.map((loc) => ({
    label: typeof loc === "string" ? loc : loc.name || loc.code,
    onClick: () => setLocale(typeof loc === "string" ? loc : loc.code),
  }));
});

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t("layout.settings"),
      icon: "i-lucide-cog",
      to: "/settings",
    },
  ],
  [
    {
      label: t("layout.locale"),
      icon: "i-lucide-language",
      children: localeItems.value,
    },
  ],
  [
    {
      label: t("layout.buyMeACoffee"),
      icon: "i-simple-icons-buymeacoffee",
      to: "https://www.buymeacoffee.com/the.blue.pixel",
      target: "_blank",
    },
    {
      label: t("layout.github"),
      icon: "i-simple-icons-github",
      to: "https://github.com/hundrog/archidome",
      target: "_blank",
    },
  ],
  [
    {
      label: t("layout.logout"),
      icon: "i-lucide-log-out",
      onClick: logout,
    },
  ],
]);
</script>
<template>
  <UDropdownMenu :items="items" v-if="user">
    <UAvatar
      :src="avatarStore.avatarUrl || undefined"
      :alt="user?.user_metadata?.full_name || 'The Archdome'"
      size="md"
      class="cursor-pointer"
    />
  </UDropdownMenu>
  <UButton
    v-else
    color="neutral"
    variant="ghost"
    to="/login"
    icon="i-lucide-log-in"
    :aria-label="$t('layout.login')"
    :label="$t('layout.login')"
  />
</template>
