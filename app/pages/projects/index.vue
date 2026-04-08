<script setup lang="ts">
// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => "Proyectos",
  description: () => "Administra tus proyectos y campañas. Crea, edita y organiza tus aventuras.",
});
</script>
<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <!-- ── Encabezado ── -->
      <div>
        <NuxtLink
          to="/campaigns"
          class="inline-flex items-center gap-2 font-body text-label-xl text-on-surface-dim hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver a campañas
        </NuxtLink>
        <h1 class="font-display text-display-sm text-on-surface">
          Your Projects
        </h1>
        <p class="font-body text-body-sm text-on-surface-dim mt-1">
          Administra tus proyectos y campañas. Crea, edita y organiza tus
          aventuras.
        </p>
      </div>
        <!-- Components -->
         <UserProjectsList />
    </div>
  </div>
</template>
