<script setup lang="ts">
const route = useRoute();
const toast = useToast();
definePageMeta({
  layout: "simple",
});
const user = useSupabaseUser();

// Combinamos errores del query (?error) y del hash (#error)
const error = computed(() => {
  // 1. Intentar obtener del query string
  if (route.query.error) {
    return {
      title: route.query.error as string,
      description: route.query.error_description as string
    }
  }

  // 2. Intentar obtener del hash (fragmento #)
  // Esto ocurre a menudo en flujos OAuth/Email de Supabase
  const hashParams = new URLSearchParams(route.hash.substring(1))
  if (hashParams.has('error')) {
    return {
      title: hashParams.get('error'),
      description: hashParams.get('error_description')?.replace(/\+/g, ' ')
    }
  }

  return null
})

onMounted(() => {
  if (error.value) {
    toast.add({
      title: "Hubo un error al iniciar sesión",
      description: "" + error.value.description,
      color: "error",
    });
    return navigateTo("/campaigns");
  }
});

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
