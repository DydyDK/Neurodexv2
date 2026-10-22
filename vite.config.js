import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" : le build fonctionne dans un sous-dossier (GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { host: true },
  build: { chunkSizeWarningLimit: 6000 },
});
