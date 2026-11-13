<script setup>
import { useNetworkStatus } from "../composables/useNetworkStatus";
const { online } = useNetworkStatus();
import { ref, onMounted, watch } from "vue";
import { useCitiesStore } from "../stores/cities";
import { useReportsStore } from "../stores/reports";
const cities = useCitiesStore(),
  reports = useReportsStore(),
  cityId = ref(cities.selectedCityId || ""),
  description = ref(""),
  locationLabel = ref(""),
  locationType = ref("citta"),
  busy = ref(false),
  error = ref(""),
  done = ref(false),
  confirmed = ref(false);
onMounted(() => {
  if (online.value) cities.fetchCities();
});
watch(online, (connected) => {
  if (connected) cities.fetchCities();
});
async function submit() {
  if (busy.value) return;
  if (!online.value) {
    error.value =
      "Sei offline. Connettiti prima di inviare: il testo resta in questa pagina.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await reports.createReport({
      cityId: cityId.value,
      description: description.value.trim(),
      locationLabel: locationLabel.value.trim(),
      locationType: locationType.value,
      aggressionLevel: "moderato",
      armed: false,
      groupSize: null,
    });
    done.value = true;
  } catch (e) {
    error.value = "Invio non riuscito. " + e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="page">
    <span class="eyebrow">Un aiuto alla tua comunità</span>
    <h1>Segnala un episodio</h1>
    <p class="muted">
      Descrivi un fatto osservato. Un moderatore lo verifica prima della
      pubblicazione.
    </p>
    <p v-if="cities.error" class="error-msg">
      {{ cities.error }} <button @click="cities.fetchCities()">Riprova</button>
    </p>
    <section v-if="done" class="surface">
      <span class="chip">In attesa di verifica</span>
      <h2>Grazie per la segnalazione</h2>
      <p>
        Dopo l’approvazione sarà visibile per 4 ore nel feed della città scelta.
      </p>
      <RouterLink to="/" class="button">Torna alle segnalazioni</RouterLink>
    </section>
    <form v-else class="surface" @submit.prevent="submit">
      <label class="field"
        ><span>Città</span
        ><select v-model="cityId" required>
          <option disabled value="">Seleziona città</option>
          <option v-for="c in cities.cities" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select></label
      ><label class="field"
        ><span>Tipo di luogo</span
        ><select v-model="locationType">
          <option value="citta">Via o piazza</option>
          <option value="metro">Metropolitana</option>
          <option value="stazione_treni">Stazione ferroviaria</option>
          <option value="altro">Altro luogo pubblico</option>
        </select></label
      ><label class="field"
        ><span>Dove è successo?</span
        ><input
          v-model="locationLabel"
          required
          maxlength="120"
          placeholder="Es. Metro Duomo, banchina M1"
        /><small
          >Indica un luogo pubblico, senza indirizzi privati.</small
        ></label
      ><label class="field"
        ><span>Cosa hai osservato?</span
        ><textarea
          v-model="description"
          required
          minlength="15"
          maxlength="1500"
          rows="5"
          placeholder="Descrivi l’episodio e quando è successo…"
        /><small
          >Non inserire nomi, contatti, targhe o dettagli che identificano
          persone.</small
        ></label
      ><label class="consent"
        ><input v-model="confirmed" type="checkbox" required /><span
          >La segnalazione riguarda un fatto che ho osservato e non contiene
          dati personali.</span
        ></label
      >
      <p v-if="!online" class="error-msg" role="status">
        Sei offline. L’invio sarà disponibile quando torni online. Il testo non
        viene inviato automaticamente.
      </p>
      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <button class="full" :disabled="busy || !confirmed || !online">
        {{ busy ? "Invio…" : "Invia alla moderazione" }}
      </button>
    </form>
  </main>
</template>
<style scoped>
.consent {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  font-size: 13px;
  line-height: 1.5;
}
.consent input {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  accent-color: #366749;
}
</style>
