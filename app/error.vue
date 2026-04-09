<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true,
  },
});

const { t } = useI18n();

useHead({
  htmlAttrs: {
    lang: "en",
  },
});

useSeoMeta({
  title: () => t("pages.error.title"),
  description: () => t("pages.error.description"),
});
</script>

<template>
  <UApp>
    <UError
      :clear="{
        color: 'neutral',
        size: 'xl',
        icon: 'i-lucide-arrow-left',
        class: 'rounded-full',
      }"
      :error="{
        statusCode: 404,
        statusMessage: $t('pages.error.statusMessage'),
        message: $t('pages.error.message'),
      }"
    />
  </UApp>
</template>
