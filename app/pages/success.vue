<template>
  <UContainer class="h-screen flex items-center justify-center text-center">
    <UCard>
      <UIcon name="i-lucide-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
      <h1 class="text-2xl font-bold mt-4">{{ $t("pages.success.title") }}</h1>
      <p class="text-gray-400 mt-2">{{ $t("pages.success.subtitle") }}</p>
      <UButton to="/campaigns" class="mt-6" variant="ghost">{{ $t("pages.success.goBack") }}</UButton>
    </UCard>
  </UContainer>
</template>