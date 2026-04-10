<template>
  <UContainer class="h-screen flex items-center justify-center text-center">
    <UCard class="w-full max-w-md mx-auto">
      <template #header>
        <h3 class="text-xl font-bold font-display">Send Feedback</h3>
        <p class="text-sm text-gray-400">Help us improve Archidome</p>
      </template>

      <form @submit.prevent="sendFeedback" class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-medium mb-1">Your Name</label>
          <UInput v-model="form.name" placeholder="Adventurer name" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Feedback Type</label>
          <USelect v-model="form.type" :options="['Bug Report', 'Feature Request', 'Other']" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Message</label>
          <UTextarea v-model="form.message" placeholder="What's on your mind?" required />
        </div>

        <UButton 
          type="submit" 
          block 
          color="primary" 
          :loading="loading"
        >
          Submit Feedback
        </UButton>
      </form>
    </UCard>
  </UContainer>
</template>

<script setup>
const supabase = useSupabaseClient()
const loading = ref(false)
const form = ref({
  name: '',
  type: 'Feature Request',
  message: ''
})

const sendFeedback = async () => {
  loading.value = true
  try {
    const { error } = await supabase
      .from('feedbacks')
      .insert([form.value])

    if (error) throw error
    
    // Éxito
    await navigateTo('/success')
  } catch (err) {
    alert('Error enviando feedback: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>