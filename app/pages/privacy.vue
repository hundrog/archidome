<template>
  <UContainer class="py-12 max-w-3xl">
    <UCard>
      <div class="space-y-6 text-on-surface-dim">
        <h1 class="text-3xl font-display text-white">Privacy Policy</h1>
        <p class="text-sm">Last updated: April 2026</p>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">1. Introduction</h2>
          <p>
            Welcome to <strong>Archdome</strong>. We respect your privacy and are committed to protecting your personal data. This policy explains how we handle your information when you use our platform.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">2. Data We Collect</h2>
          <p>We only collect information necessary to provide our TTRPG management services:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Identity Data:</strong> Name and profile picture provided by Discord or Google via OAuth.</li>
            <li><strong>Contact Data:</strong> Email address used for authentication.</li>
            <li><strong>User Content:</strong> Campaign details, system names, and project information you voluntarily create.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">3. How We Use Your Data</h2>
          <p>Your data is used exclusively to:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Manage your account and project permissions.</li>
            <li>Display your profile as a Game Master or collaborator.</li>
            <li>Generate campaign social cards.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">4. Third-Party Services</h2>
          <p>Archdome uses specialized third-party services to operate:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> For database storage and authentication management.</li>
            <li><strong>Netlify:</strong> For web hosting.</li>
            <li><strong>Discord/Google:</strong> For secure social login.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">5. Your Rights</h2>
          <p>
            You can delete your account and all associated data at any time. Since we do not sell your data or use it for marketing, your information remains strictly within the scope of your TTRPG activities.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-xl font-bold text-white">6. Contact</h2>
          <p>
            If you have questions about this policy, you can reach out via our GitHub repository or community channels.
          </p>
        </section>

        <div class="pt-6">
          <UButton to="/" variant="ghost" icon="i-heroicons-arrow-left">
            Back to Home
          </UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>