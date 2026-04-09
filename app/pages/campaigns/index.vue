<script setup lang="ts">
const { t } = useI18n();
useSeoMeta({
  title: () => t("pages.campaigns.title"),
  description: () => t("pages.campaigns.description"),
});
</script>
<template>
  <CampaignGrid />
</template>
