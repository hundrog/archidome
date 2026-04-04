// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue'
  ],
  theme: {
    extend: {

      // ── Colores ──────────────────────────────────────────────────────────────
      colors: {
        // Superficies (layering system)
        surface: {
          DEFAULT:        '#0d072e', // base layer
          low:            '#120c37', // sectional layer
          high:           '#1e174a', // interactive layer (cards)
          bright:         '#2b235e', // hover state
          variant:        '#2d2854', // glass elements
          lowest:         '#000000', // inputs
        },

        // Primarios — "magical active state"
        primary: {
          DEFAULT:        '#9fa7ff',
          container:      '#8d98ff',
          fixed:          '#ffffff', // on-primary-fixed (text sobre primary)
        },

        // Secundarios — "mystic accent"
        secondary: {
          DEFAULT:        '#be83fa',
          container:      '#62259b',
          on:             '#e4c4ff', // on-secondary-container
        },

        // Terciario — "featured / star"
        tertiary: {
          DEFAULT:        '#ffd16f',
        },

        // Texto
        'on-surface':     '#e8e2ff', // nunca usar #ffffff puro
        'on-surface-dim': '#a89ec0', // texto secundario/apagado

        // Bordes fantasma
        outline: {
          DEFAULT:        '#48436b',
          variant:        '#48436b', // usar al 20% opacity
        },

        // Error
        error: {
          DEFAULT:        '#ff6e84',
          container:      '#5c1a26',
        },
      },

      // ── Tipografía ───────────────────────────────────────────────────────────
      fontSize: {
        // Display
        'display-lg': ['3.5rem',  { lineHeight: '1.1',  fontWeight: '700' }],
        'display-md': ['2.5rem',  { lineHeight: '1.15', fontWeight: '700' }],
        'display-sm': ['2rem',    { lineHeight: '1.2',  fontWeight: '600' }],

        // Headlines
        'headline-lg': ['2rem',   { lineHeight: '1.25', fontWeight: '600' }],
        'headline-md': ['1.75rem',{ lineHeight: '1.3',  fontWeight: '600' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],

        // Body
        'body-lg': ['1rem',       { lineHeight: '1.6',  fontWeight: '400' }],
        'body-md': ['0.9375rem',  { lineHeight: '1.6',  fontWeight: '400' }],
        'body-sm': ['0.875rem',   { lineHeight: '1.5',  fontWeight: '400' }],

        // Labels
        'label-lg': ['1rem',      { lineHeight: '1.4',  fontWeight: '500' }],
        'label-md': ['0.75rem',   { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.05em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.4',  fontWeight: '500' }],
      },

      // ── Border radius ────────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.5rem',   // base — everything feels approachable
        md:      '0.75rem',  // chips, tags
        lg:      '1rem',     // cards
        xl:      '1.5rem',   // search bar, modals
        full:    '9999px',   // buttons primary
      },

      // ── Sombras (ambient glow, no drop shadows clásicos) ─────────────────────
      boxShadow: {
        // Floating elements — magical glow
        'ambient':  '0 0 40px 0 rgba(232, 226, 255, 0.06)',
        // Cards hover
        'card-hover': '0 8px 32px 0 rgba(159, 167, 255, 0.12)',
        // Input focus glow
        'input-focus': '0 0 0 2px rgba(159, 167, 255, 0.4)',
        // Error glow
        'input-error': '0 0 0 2px rgba(255, 110, 132, 0.4)',
      },

      // ── Backdrop blur ─────────────────────────────────────────────────────────
      backdropBlur: {
        glass: '24px',
      },

      // ── Spacing extra ─────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

    },
  },
  plugins: [],
} satisfies Config