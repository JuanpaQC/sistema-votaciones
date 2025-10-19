import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)",

        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(240 10% 3.9%)",

        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        ring: "hsl(240 5% 64.9%)",

        primary: "hsl(240 5.9% 10%)",
        "primary-foreground": "hsl(0 0% 98%)",

        secondary: "hsl(240 4.8% 95.9%)",
        "secondary-foreground": "hsl(240 5.9% 10%)",

        destructive: "hsl(0 84.2% 60.2%)",
        "destructive-foreground": "hsl(0 0% 98%)",

        muted: "hsl(240 4.8% 95.9%)",
        "muted-foreground": "hsl(240 3.8% 46.1%)",

        accent: "hsl(240 4.8% 95.9%)",
        "accent-foreground": "hsl(240 5.9% 10%)",
      },

      boxShadow: {
        soft: "0 6px 30px -12px rgba(0,0,0,.12)",
        glass: "0 8px 40px -16px rgba(0,0,0,.18)",
        focus: "0 0 0 3px rgba(99,102,241,0.25)",
      },

      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      keyframes: {
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },

      animation: {
        "slide-up": "slide-up .45s ease-out both",
        "fade-in": "fade-in .3s ease-out both",
        "scale-in": "scale-in .35s ease-out both",
      },

      backdropBlur: {
        xs: "2px",
      },

      transitionTimingFunction: {
        soft: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config
