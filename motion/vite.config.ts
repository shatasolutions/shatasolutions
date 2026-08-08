import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the build relocatable (GitHub Pages project path or any static host).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", assetsInlineLimit: 0 },
});
