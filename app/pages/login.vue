<script setup lang="ts">
const supabase = useSupabaseClient()
const config = useRuntimeConfig()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
  }
}, {
  label: 'Discord',
  icon: 'i-simple-icons-discord',
  onClick: () => {
    signInWithDiscord()
  }
}]

async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
      options: {
    redirectTo: `${config.public.clientUrl}/confirm`,
  },
  })
}
</script>

<template>
  <UAuthForm
    :providers="providers"
    title="Welcome back"
    icon="i-lucide-lock"
  >
    <template #footer>
      By signing in, you agree to our <ULink
        to="/"
        class="text-primary font-medium"
      >Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>