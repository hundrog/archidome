// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: ["@nuxt/ui", "@nuxtjs/supabase", "@pinia/nuxt"],
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
      include: ["campaigns/[id]/edit", "/campaigns/new", "/settings"],
      exclude: ["/campaigns", "/campaigns/[id]"],
      saveRedirectToCookie: false,
    },
  },
  routeRules: {
    "/**": {
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data: blob:",
          "worker-src blob:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    },
  },
});
