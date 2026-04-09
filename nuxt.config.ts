// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: ["@nuxt/ui", "@nuxtjs/supabase", "@pinia/nuxt", "@nuxt/image"],
  css: ["~/assets/css/main.css"],
  colorMode: {
    preference: "dark",
  },
  vite: {
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit", "zod", "html-to-image"],
    },
  },
  runtimeConfig: {
    public: {
      clientUrl: "",
    },
  },
  supabase: {
    // redirect: false
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["campaigns/[id]/edit", "/campaigns/new", "/settings", "/projects", "/projects/*"],
      exclude: ["/campaigns", "/campaigns/[id]"],
      saveRedirectToCookie: false,
    },
  },
  image: {
    domains: [process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : '']
  },
  routeRules: {
    "/**": {
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data: blob: https://*.supabase.co https://*.discordapp.com https://*.googleusercontent.com",
          "worker-src blob:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com https://*.supabase.co wss://*.supabase.co https://*.discordapp.com https://*.googleusercontent.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    },
  },
  app: {
    head: {
      meta: [
        { 
          name: 'google-site-verification', 
          content: 'rtz3dRXj_l_9ht-UT4qBnGbeF9HWFNqNrQBBYS3xriQ' 
        }
      ]
    }
  }
});