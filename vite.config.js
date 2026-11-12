import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE_PATH || "/";
  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        includeAssets: ["favicon.png", "apple-touch-icon.png"],
        manifest: {
          id: base,
          name: "PickAlert",
          short_name: "PickAlert",
          description:
            "Segnalazioni di borseggio approvate dalla moderazione nella tua città.",
          lang: "it",
          start_url: base,
          scope: base,
          display: "standalone",
          background_color: "#f6f8f2",
          theme_color: "#366749",
          icons: [
            {
              src: `${base}pickalert-icon.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: `${base}pickalert-icon-512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        workbox: {
          cacheId: "pickalert",
          globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
          cleanupOutdatedCaches: true,
          navigateFallback: `${base}index.html`,
          // Only the static app shell is cached. Supabase/auth/report responses
          // always use the network; no background sync or cached report data.
          runtimeCaching: [],
        },
        devOptions: { enabled: false },
      }),
    ],
  };
});
