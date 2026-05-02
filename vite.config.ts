import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/LangMap/" : "/",
  server: { port: 5173, strictPort: false },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/data/countries.geo.json")) return "geo-countries";
          if (id.includes("/data/admin1.geo.json")) return "geo-admin1";
          if (id.includes("/src/data/languages.ts") || id.includes("/data/regional-languages.ts") || id.includes("/data/languages.fixture.ts")) {
            return "data-languages";
          }
        },
      },
    },
    chunkSizeWarningLimit: 4000,
  },
}));
