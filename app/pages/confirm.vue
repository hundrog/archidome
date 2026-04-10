<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { t } = useI18n();
const user = useSupabaseUser();
const avatarStore = useAvatarStore();

definePageMeta({
  layout: "simple",
});

const error = computed(() => {
  if (route.query.error) {
    return {
      title: route.query.error as string,
      description: route.query.error_description as string,
    };
  }

  const hashParams = new URLSearchParams(route.hash.substring(1));
  if (hashParams.has("error")) {
    return {
      title: hashParams.get("error"),
      description: hashParams.get("error_description")?.replace(/\+/g, " "),
    };
  }

  return null;
});

onMounted(() => {
  if (error.value) {
    toast.add({
      title: t("pages.confirm.signInError"),
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
      avatarStore.fetchOnce(user.value.sub);
      return navigateTo("/campaigns");
    } else {
      avatarStore.reset();
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
