<script setup>
import { useRegisterSW } from "virtual:pwa-register/vue";
import { useNetworkStatus } from "../composables/useNetworkStatus";
const { online } = useNetworkStatus();
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisterError() {
    // Failure to enable offline assets must never block online app usage.
    console.warn(
      "[PickAlert] Modalità offline non disponibile in questo browser.",
    );
  },
});
</script>
<template>
  <div v-if="!online" class="connection-banner" role="status">
    Sei offline. Connettiti per consultare avvisi aggiornati e inviare
    segnalazioni.
  </div>
  <div v-if="needRefresh && online" class="update-banner" role="status">
    <span
      >È disponibile una nuova versione. Salva eventuale testo prima di
      ricaricare.</span
    >
    <button @click="updateServiceWorker(true)">Aggiorna app</button>
    <button class="text-button" @click="needRefresh = false">Più tardi</button>
  </div>
</template>
<style scoped>
.connection-banner,
.update-banner {
  padding: 14px 24px;
  font-size: 14px;
  line-height: 1.5;
  background: #fff0cd;
  color: #614914;
}
.update-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: #d5ebd7;
  color: #244e34;
}
.update-banner span {
  flex: 1;
  min-width: 200px;
}
</style>
