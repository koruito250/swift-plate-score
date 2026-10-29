// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({ vite: { plugins: [VitePWA({
  strategies: "generateSW",
  filename: "sw.js",
  registerType: "autoUpdate",
  injectRegister: null,
  manifest: false,
  devOptions: { enabled: false },
  includeAssets: ["offline.html", "icons/*.png", "favicon.png", "manifest.json"],
  workbox: {
    globPatterns: ["**/*.{js,css,woff2,png,jpg,svg}"],
    globIgnores: ["**/server/**", "**/node_modules/**"],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    navigateFallback: undefined,
    runtimeCaching: [{
      urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin
        && !/^\/(?:~oauth|api|_serverFn)(?:\/|$)/.test(url.pathname),
      handler: "NetworkFirst",
      options: {
        cacheName: "corpmind-navigation",
        networkTimeoutSeconds: 5,
        // Never retain authenticated HTML, customer data, or QR table URLs.
        plugins: [{ cacheWillUpdate: async () => null }],
        precacheFallback: { fallbackURL: "/offline.html" },
      },
    }, {
      urlPattern: ({ url }) => url.origin === self.location.origin && /^\/assets\/.+-[\w-]{8,}\.(?:js|css|woff2|png|jpg|svg)$/.test(url.pathname),
      handler: "CacheFirst",
      options: { cacheName: "corpmind-hashed-assets", expiration: { maxEntries: 80, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [200] } },
    }],
  },
})] } });
