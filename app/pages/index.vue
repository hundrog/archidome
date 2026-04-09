<script lang="ts" setup>
const { t } = useI18n();
navigateTo("/campaigns");

useSeoMeta({
  title: () => t("pages.index.title"),
  description: () => t("pages.index.description"),
});
</script>
<template>
  <div class="flex flex-col items-center justify-center h-full gap-6">
    <h1 class="text-3xl font-bold">{{ $t("pages.index.redirecting") }}</h1>
    <p class="text-gray-600">
      {{ $t("pages.index.redirectHint") }}
    </p>
    <button
      @click="navigateTo('/campaigns')"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      {{ $t("pages.index.goToCampaigns") }}
    </button>
  </div>
</template>
