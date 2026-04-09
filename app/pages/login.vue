<script setup lang="ts">
import type { Provider } from "@supabase/supabase-js";
const supabase = useSupabaseClient();
const config = useRuntimeConfig();
const { t } = useI18n();

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: () => t("pages.login.title"),
  description: () => t("pages.login.description"),
});

const providers = computed(() => [
  {
    label: t("pages.login.google"),
    icon: "i-simple-icons-google",
    onClick: () => {
      signInWithProvider("google");
    },
  },
  {
    label: t("pages.login.discord"),
    icon: "i-simple-icons-discord",
    onClick: () => {
      signInWithProvider("discord");
    },
  },
]);

async function signInWithProvider(provider: Provider) {
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${config.public.clientUrl}/confirm`,
    },
  });
}
</script>

<template>
  <UAuthForm
    :providers="providers"
    :title="$t('pages.login.welcomeBack')"
    icon="i-lucide-lock"
  >
    <template #footer>
      {{ $t("pages.login.signInAgree") }}
      <ULink to="/" class="text-primary font-medium">{{
        $t("pages.login.termsLink")
      }}</ULink
      >.
    </template>
  </UAuthForm>
</template>
