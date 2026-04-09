<script setup lang="ts">
const props = defineProps<{
  initialUrl?: string | null;
}>();

const emit = defineEmits<{
  update: [payload: { file: File | null; removed: boolean }];
}>();

const toast = useToast();
const { t } = useI18n();
const fileInputRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(props.initialUrl ?? null);
const imageFile = ref<File | null>(null);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.add({
      title: t("campaign.imageField.invalidFile"),
      description: t("campaign.imageField.imagesOnly"),
      color: "error",
    });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: t("campaign.imageField.tooLarge"),
      description: t("campaign.imageField.maxSize"),
      color: "error",
    });
    return;
  }

  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
  emit("update", { file, removed: false });
}

function removeImage() {
  imageFile.value = null;
  imagePreview.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
  emit("update", { file: null, removed: true });
}

onUnmounted(() => {
  if (imagePreview.value?.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreview.value);
  }
});
</script>

<template>
  <UFormField :label="$t('campaign.imageField.label')" name="image">
    <div class="space-y-3">
      <div
        v-if="imagePreview"
        class="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        style="max-height: 220px"
      >
        <img
          :src="imagePreview"
          :alt="$t('common.preview')"
          class="w-full object-cover"
          style="max-height: 220px"
        />
        <UButton
          icon="i-lucide-x"
          color="error"
          variant="solid"
          size="xs"
          class="absolute top-2 right-2"
          @click="removeImage"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 cursor-pointer hover:border-primary-400 transition-colors"
        @click="fileInputRef?.click()"
      >
        <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-400" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t("campaign.imageField.uploadPrompt") }}
        </p>
        <p class="text-xs text-gray-400">
          {{ $t("campaign.imageField.formats") }}
        </p>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
    </div>
  </UFormField>
</template>
