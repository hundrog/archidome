<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <UButton
          icon="i-lucide-chevron-left"
          :to="`/campaigns/${id}`"
          size="xl"
          color="neutral"
          variant="subtle"
          class="rounded-full z-10"
        />
        <h1 class="text-2xl font-bold">Editar Campaña</h1>
      </div>
    </template>
    <CampaignForm :campaign-id="id" />
  </UCard>
</template>
