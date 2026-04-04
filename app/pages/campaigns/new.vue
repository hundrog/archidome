<script setup lang="ts"></script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-chevron-left"
          to="/campaigns"
          size="xl"
          color="neutral"
          variant="subtle"
          class="rounded-full z-10"
        />
        <h1 class="text-2xl font-bold">Crear Campaña</h1>
      </div>
    </template>
    <CampaignForm />
  </UCard>
</template>
