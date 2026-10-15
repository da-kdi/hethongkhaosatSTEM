import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// BASE_PATH: đặt "/<tên-repo>/" khi build cho GitHub Pages (bản demo); "/" khi tự host.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_PATH ?? "/",
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
