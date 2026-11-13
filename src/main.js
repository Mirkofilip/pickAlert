import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import "./composables/usePwaInstall";
import { useAuthStore } from "./stores/auth";

// Capture the recovery callback before Supabase consumes and clears the hash.
const recoveryCallback =
  new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
const app = createApp(App);
app.use(createPinia());
const auth = useAuthStore();
if (navigator.onLine) {
  await auth.init();
} else {
  auth.loading = false;
  window.addEventListener("online", () => auth.init(), { once: true });
}
// Initialize routing after Auth consumes recovery tokens from the URL hash.
const { default: router } = await import("./router");
app.use(router);
await router.isReady();
if (recoveryCallback) await router.replace("/recupera-password");
app.mount("#app");
