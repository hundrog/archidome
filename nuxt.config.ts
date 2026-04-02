// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit", "zod"],
    },
  },
  runtimeConfig: {
    public: {
      clientUrl: process.env.APP_URL,
    },
  },
  supabase: {
    // redirect: false
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: undefined,
      exclude: ['/campaigns', '/campaigns/*', '/campaigns/**', '/signup'],
      saveRedirectToCookie: false,
    },
  },
});
