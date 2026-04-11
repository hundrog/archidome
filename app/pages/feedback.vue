<template>
  <UContainer class="h-screen flex items-center justify-center text-center">
    <UCard class="w-full max-w-md x-auto">
      <template #header>
        <h3 class="text-xl font-bold font-display">{{ $t("pages.feedback.title") }}</h3>
        <p class="text-sm text-gray-400">{{ $t("pages.feedback.subtitle") }}</p>
      </template>

      <form @submit.prevent="sendFeedback">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("pages.feedback.nameLabel") }}</label>
            <input
              type="text"
              name="name"
              required
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("pages.feedback.typeLabel") }}</label>
            <select
              name="type"
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white outline-none"
            >
              <option value="Bug Report">{{ $t("pages.feedback.typeBug") }}</option>
              <option value="Feature Request">{{ $t("pages.feedback.typeFeature") }}</option>
              <option value="Other">{{ $t("pages.feedback.typeOther") }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("pages.feedback.messageLabel") }}</label>
            <textarea
              name="message"
              required
              rows="4"
              class="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white outline-none"
            ></textarea>
          </div>

          <UButton type="submit" block>{{ $t("pages.feedback.submit") }}</UButton>
        </div>
      </form>
    </UCard>
  </UContainer>
</template>

<script setup>
const { t } = useI18n();
const supabase = useSupabaseClient();
const loading = ref(false);
const form = ref({
  name: "",
  type: "Feature Request",
  message: "",
});
const botField = ref('')

const sendFeedback = async () => {
  if (botField.value !== '') {
    console.warn("Bot detected")
    return 
  }
  loading.value = true;
  try {
    const { error } = await supabase.from("feedbacks").insert([form.value]);

    if (error) throw error;

    // Éxito
    await navigateTo("/success");
  } catch (err) {
    alert(t("pages.feedback.sendError", { message: err.message }));
  } finally {
    loading.value = false;
  }
};
</script>
