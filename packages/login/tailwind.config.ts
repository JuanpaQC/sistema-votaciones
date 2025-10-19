import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    // si usas UI compartida o layouts fuera:
    "../../packages/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // paleta minimalista (tipo shadcn)
        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(240 10% 3.9%)",
        popover: "hsl(0 0% 100%)",
        "popover-foreground": "hsl(240 10% 3.9%)",
        primary: "hsl(240 5.9% 10%)",
        "primary-foreground": "hsl(0 0% 98%)",
        secondary: "hsl(240 4.8% 95.9%)",
        "secondary-foreground": "hsl(240 5.9% 10%)",
        muted: "hsl(240 4.8% 95.9%)",
        "muted-foreground": "hsl(240 3.8% 46.1%)",
        accent: "hsl(240 4.8% 95.9%)",
        "accent-foreground": "hsl(240 5.9% 10%)",
        destructive: "hsl(0 84.2% 60.2%)",
        "destructive-foreground": "hsl(0 0% 98%)",
        border: "hsl(240 5.9% 90%)",
        input: "hsl(240 5.9% 90%)",
        ring: "hsl(240 5% 64.9%)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "80%,100%": { transform: "scale(1.03)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in .4s ease-out both",
        "slide-up": "slide-up .45s ease-out both",
        "ping-soft": "ping-soft 1.2s cubic-bezier(0,0,.2,1) infinite",
      },
      boxShadow: {
        soft: "0 6px 30px -12px rgba(0,0,0,.12)",
        glass: "0 8px 40px -16px rgba(0,0,0,.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
export default config
