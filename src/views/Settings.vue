<script setup>
import { ref, onMounted, watch } from "vue";
import { useCitiesStore } from "../stores/cities";
import { usePwaInstall } from "../composables/usePwaInstall";
import { useNetworkStatus } from "../composables/useNetworkStatus";
const cities = useCitiesStore();
const { installEvent, installed, install } = usePwaInstall();
const { online } = useNetworkStatus();
const selected = ref(cities.selectedCityId || "");
const error = ref("");
const message = ref("");
onMounted(() => {
  if (online.value) cities.fetchCities();
});
watch(online, (connected) => {
  if (connected) cities.fetchCities();
});
function save() {
  error.value = "";
  message.value = "";
  if (!selected.value) {
    error.value = "Seleziona una città.";
    return;
  }
  cities.selectCity(selected.value);
  message.value = "Zona salvata.";
}
</script>
<template>
  <main class="page">
    <span class="eyebrow">Le tue preferenze</span>
    <h1>Impostazioni</h1>
    <p class="muted">Scegli la città da consultare. Nessun GPS necessario.</p>
    <p v-if="cities.error && online" class="error-msg">
      {{ cities.error }} <button @click="cities.fetchCities()">Riprova</button>
    </p>
    <form class="surface" @submit.prevent="save">
      <label class="field"
        ><span>La tua zona</span
        ><select v-model="selected" required :disabled="!online">
          <option disabled value="">Scegli una città</option>
          <option v-for="c in cities.cities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select></label
      >
      <p class="muted">
        Se scegli Milano vedrai le segnalazioni approvate di Milano. Gli avvisi
        si aggiornano mentre l’app è aperta e connessa. Non inviamo notifiche.
      </p>
      <p v-if="!online" class="muted">Connettiti per scegliere la città.</p>
      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <p v-if="message" class="success-msg" role="status">{{ message }}</p>
      <button class="full" :disabled="!online">Salva zona</button>
    </form>
    <section class="surface">
      <h2>
        {{
          installed
            ? "PickAlert è installata"
            : "PickAlert sulla schermata Home"
        }}
      </h2>
      <p v-if="installed">
        Puoi aprire PickAlert direttamente dalla sua icona. Per consultare e
        inviare segnalazioni serve una connessione.
      </p>
      <template v-else>
        <p>
          Installa PickAlert per aprirla come un’app, senza passare ogni volta
          dal browser.
        </p>
        <button v-if="installEvent" @click="install">Installa PickAlert</button>
        <p>
          <strong>Android e computer:</strong> apri il menu del browser e scegli
          “Installa app” oppure “Aggiungi a schermata Home”, se disponibile.
        </p>
        <p>
          <strong>iPhone e iPad:</strong> apri il sito in Safari, tocca
          Condividi e scegli “Aggiungi alla schermata Home”.
        </p>
      </template>
    </section>
    <section class="surface">
      <h2>Privacy, senza account</h2>
      <p>
        Non chiediamo nome, email, foto o posizione GPS per segnalare. La città
        scelta resta su questo dispositivo.
      </p>
      <p>
        Questa versione non usa notifiche push, token Firebase o tracciamento
        pubblicitario. I fornitori del servizio possono trattare log tecnici di
        connessione.
      </p>
      <RouterLink to="/info">Informazioni sul servizio →</RouterLink>
    </section>
  </main>
</template>
