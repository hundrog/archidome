<script setup lang="ts">
definePageMeta({
  layout: "simple",
});
const user = useSupabaseUser();

watch(
  user,
  () => {
    if (user.value) {
      // Redirect to protected page
      return navigateTo("/campaigns");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex justify-center">
    <UIcon name="i-lucide-boxes" class="size-5 animate-spin" />
  </div>
</template>
