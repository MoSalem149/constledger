import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Proxy targets default to localhost for non-Docker dev (running
// `npm run dev` directly on the host, where Vite and both backends share
// the same loopback interface). docker-compose.yml overrides these two
// env vars to the Compose service names (http://backend-core:3000 /
// http://backend-ai:5000) so the proxy can actually reach the sibling
// containers on the cpms-net network -- "localhost" inside the frontend
// container only ever refers to the frontend container itself.
const CORE_PROXY_TARGET = process.env.CORE_PROXY_TARGET || "http://localhost:3000";
const AI_PROXY_TARGET = process.env.AI_PROXY_TARGET || "http://localhost:5000";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["constledger.png"],
      manifest: {
        name: "CPMS — Construction Project Management System",
        short_name: "CPMS",
        description: "Construction Project Management System — contracts, finance, and reporting.",
        theme_color: "#FF4800",
        background_color: "#FAF8F6",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Don't let the service worker cache/intercept API calls — auth and
        // financial data must always hit the network, never the SW cache.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    sourcemap: true,
    minify: false,
    chunkSizeWarningLimit: 3000,
  },
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    strictPort: true,
    proxy: {
      // Core backend (auth + users + finance + reports)
      "/api/auth": CORE_PROXY_TARGET,
      "/api/users": CORE_PROXY_TARGET,
      "/api/finance": CORE_PROXY_TARGET,
      "/api/reports": CORE_PROXY_TARGET,
      // AI backend (contracts, uploads)
      "/api/contracts": AI_PROXY_TARGET,
      "/api/uploads": AI_PROXY_TARGET,
    },
  },
  preview: {
    port: Number(process.env.VITE_PORT) || 5173,
  },
});
