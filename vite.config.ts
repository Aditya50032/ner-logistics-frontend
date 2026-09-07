import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
<<<<<<< HEAD
=======
  base: "/ner-logistics-frontend/",
>>>>>>> 25066e1f9fa6d7bd91c3e7f0bedd40e2d314b6ca
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      // FastAPI backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
