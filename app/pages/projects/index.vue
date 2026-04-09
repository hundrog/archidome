<script setup lang="ts">
const { t } = useI18n();
useSeoMeta({
  title: () => t("pages.projectsIndex.title"),
  description: () => t("pages.projectsIndex.description"),
});
</script>
<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <NuxtLink
          to="/campaigns"
          class="inline-flex items-center gap-2 font-body text-label-xl text-on-surface-dim hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          {{ $t("pages.projectsIndex.back") }}
        </NuxtLink>
        <h1 class="font-display text-display-sm text-on-surface">
          {{ $t("pages.projectsIndex.heading") }}
        </h1>
        <p class="font-body text-body-sm text-on-surface-dim mt-1">
          {{ $t("pages.projectsIndex.subtitle") }}
        </p>
      </div>
      <ProjectList />
    </div>
  </div>
</template>
