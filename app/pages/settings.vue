<script setup lang="ts">
const user = useSupabaseUser();
const { t } = useI18n();

const tabs = computed(() => [
  { label: t("pages.settings.tabProfile"), slot: "profile", icon: "i-lucide-user" },
  { label: t("pages.settings.tabAccount"), slot: "account", icon: "i-lucide-shield" },
]);

const logout = async () => {
  await useSupabaseClient().auth.signOut();
  navigateTo("/login");
};

useSeoMeta({
  title: () => t("pages.settings.title"),
  description: () => t("pages.settings.description"),
});
</script>

<template>
  <div class="min-h-screen bg-surface text-on-surface px-4 py-10">
    <div class="max-w-3xl mx-auto space-y-8">
      <div class="flex items-center gap-4">
        <img
          v-if="user?.user_metadata?.avatar_url"
          :src="user.user_metadata.avatar_url"
          :alt="user.user_metadata.full_name"
          class="size-14 rounded-full object-cover ring-2 ring-outline"
        />
        <div
          v-else
          class="size-14 rounded-full bg-secondary-container flex items-center justify-center ring-2 ring-outline"
        >
          <UIcon name="i-lucide-user" class="size-6 text-gray-500" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">
            {{ user?.user_metadata?.full_name ?? $t("pages.settings.myAccount") }}
          </h1>
          <p class="text-sm text-gray-400">{{ user?.email }}</p>
        </div>
      </div>

      <UTabs :items="tabs">
        <template #profile>
          <div class="pt-6">
            <UserProfileForm />
          </div>
        </template>

        <template #account>
          <div class="pt-6 space-y-6">
            <div class="space-y-2">
              <h3
                class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
              >
                {{ $t("pages.settings.session") }}
              </h3>
              <div
                class="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 border border-gray-800"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-log-out" class="size-4 text-gray-500" />
                  <span class="text-sm text-gray-300">{{
                    $t("pages.settings.signOutDevice")
                  }}</span>
                </div>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :label="$t('pages.settings.signOut')"
                  @click="logout"
                />
              </div>
            </div>

            <USeparator />

            <UserDeleteAccount />
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
