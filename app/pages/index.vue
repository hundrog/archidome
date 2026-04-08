<script lang="ts" setup>
navigateTo("/campaigns");

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => "The Archidome",
  description: () => "Encuentra campañas de rol para unirte o inspírate para crear la tuya propia.",
});
</script>
<template>
  <div class="flex flex-col items-center justify-center h-full gap-6">
    <h1 class="text-3xl font-bold">Redirigiendo a campañas...</h1>
    <p class="text-gray-600">
      Si no eres redirigido automáticamente, haz clic en el botón de abajo.
    </p>
    <button
      @click="navigateTo('/campaigns')"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Ir a Campañas
    </button>
  </div>
</template>
