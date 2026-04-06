export default defineAppConfig({
  ui: {
    colors: {
      primary: "indigo", // NuxtUI usará tu primary customizado
      secondary: "purple",
      tertiary: "amber",
      error: "red",
      neutral: "slate",
    },

    // Overrides de componentes
    button: {
      slots: {
        base: "font-body font-medium transition-transform active:scale-[0.98] cursor-pointer",
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class: "gradient-primary text-white shadow-card-hover",
        },
        {
          variant: "outline",
          class: "ghost-border bg-transparent",
        },
      ],
    },

    card: {
      slots: {
        root: "card shadow-ambient",
        header: "font-display",
        body: "font-body",
      },
    },

    input: {
      slots: {
        root: "font-body",
        base: "bg-surface-lowest text-on-surface ghost-border focus:shadow-input-focus",
      },
    },

    badge: {
      slots: {
        base: "label-metadata",
      },
    },

    modal: {
      slots: {
        overlay: "bg-surface/80 backdrop-blur-glass",
        content: "bg-surface-high shadow-ambient ghost-border",
      },
    },

    select: {
      slots: {
        base: "font-body bg-surface-lowest text-on-surface ghost-border",
        content: "bg-surface-high ghost-border",
      },
    },

    tabs: {
      slots: {
        root: "font-body",
        list: "bg-surface-low",
        indicator: "bg-primary",
      },
    },

    separator: {
      slots: {
        border: "border-outline-variant/20",
      },
    },
  },
});
