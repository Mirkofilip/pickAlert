import { ref } from "vue";

// Imported at startup so the browser's install event is retained even before
// the user opens Settings. No user/device identifier is generated or stored.
const installEvent = ref(null);
const installed = ref(
  window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true,
);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installEvent.value = event;
});
window.addEventListener("appinstalled", () => {
  installed.value = true;
  installEvent.value = null;
});
export function usePwaInstall() {
  async function install() {
    const event = installEvent.value;
    if (!event) return;
    installEvent.value = null;
    await event.prompt();
    // appinstalled is the authoritative success signal. Accepting a prompt
    // alone doesn't guarantee the installation has finished.
    await event.userChoice;
  }
  return { installEvent, installed, install };
}
