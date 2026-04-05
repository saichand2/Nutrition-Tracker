import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const previewPort = Number(process.env.PORT) || 4173;

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  preview: {
    host: "0.0.0.0",
    port: previewPort,
    strictPort: true,
    allowedHosts: ["gsc-nutrition-tracker.up.railway.app"],
  },
});
