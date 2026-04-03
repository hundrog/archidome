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
      include: ["campaigns/[id]/edit", "/campaigns/new"],
      exclude: ["/campaigns", "/campaigns/[id]", "/signup"],
      saveRedirectToCookie: false,
    },
  },
  routeRules: {
    "/**": {
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'", // unsafe-inline requerido por Nuxt/Vue
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data: blob:", // permite imágenes de Supabase
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
          "frame-ancestors 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    },
  },
});
