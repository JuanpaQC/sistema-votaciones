import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,           // 👈 puerto para el admin (ajusta si usas otro)
    proxy: {
      "/api": {
        target: "http://localhost:4000", // 👈 vote-server
        changeOrigin: true
        // secure: false,            // (solo si usas https self-signed)
        // rewrite: p => p           // (no necesitas rewrite)
      }
    }
  }
});
