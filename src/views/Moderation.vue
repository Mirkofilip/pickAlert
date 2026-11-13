<script setup>
import { useNetworkStatus } from "../composables/useNetworkStatus";
const { online } = useNetworkStatus();
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useModerationStore } from "../stores/moderation";
import { useCitiesStore } from "../stores/cities";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const store = useModerationStore();
const cities = useCitiesStore();
const router = useRouter();
const error = ref("");
const busy = ref(false);
const tab = ref("pending");
const editing = ref(null);
const description = ref("");
const cityId = ref("");
const displayed = computed(() =>
  tab.value === "pending" ? store.pendingReports : store.allReports,
);
const statusLabel = (status) =>
  ({ pending: "Da verificare", approved: "Pubblicata", rejected: "Rifiutata" })[
    status
  ];

async function run(action) {
  if (busy.value) return;
  if (!online.value) {
    error.value = "La moderazione richiede una connessione internet.";
    return;
  }
  busy.value = true;
  error.value = "";
  try {
    await action();
    await Promise.all([store.fetchPending(), store.fetchAll()]);
  } catch (e) {
    error.value = e.message || "Operazione non riuscita. Riprova.";
  } finally {
    busy.value = false;
  }
}
onMounted(() => run(() => cities.fetchCities()));
function edit(report) {
  editing.value = report.id;
  description.value = report.description;
  cityId.value = report.city_id;
}
async function save(id) {
  await run(() =>
    store.updateReport(id, {
      description: description.value.trim(),
      city_id: cityId.value,
    }),
  );
  if (!error.value) editing.value = null;
}
async function remove(id) {
  if (window.confirm("Eliminare definitivamente questa segnalazione?"))
    await run(() => store.deleteReport(id));
}
async function logout() {
  await auth.signOut();
  await router.push("/");
}
</script>

<template>
  <main class="page">
    <span class="eyebrow">Area riservata</span>
    <div class="heading">
      <h1>Moderazione</h1>
      <button class="text-button" @click="logout">Esci</button>
    </div>
    <p class="muted">
      Approva solo fatti pertinenti. Rimuovi dati personali, accuse
      identificabili e contenuti offensivi prima di pubblicare.
    </p>
    <p class="muted">
      Ogni approvazione pubblica l’avviso nel feed della città. La segnalazione
      resta visibile per 4 ore da quel momento.
    </p>
    <div class="tabs" role="group" aria-label="Filtro segnalazioni">
      <button :class="{ selected: tab === 'pending' }" @click="tab = 'pending'">
        Da verificare · {{ store.pendingReports.length }}
      </button>
      <button :class="{ selected: tab === 'all' }" @click="tab = 'all'">
        Tutte
      </button>
    </div>
    <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
    <p v-if="busy" class="muted" role="status">Aggiornamento…</p>
    <div v-if="!displayed.length && !busy" class="empty">
      Nessuna segnalazione da mostrare.
    </div>
    <article v-for="report in displayed" :key="report.id" class="surface">
      <div class="heading">
        <span class="chip">{{ statusLabel(report.status) }}</span><small>{{
          new Date(report.created_at).toLocaleString("it-IT")
        }}</small>
      </div>
      <h2>{{ report.cities?.name }} · {{ report.location_label }}</h2>
      <form v-if="editing === report.id" @submit.prevent="save(report.id)">
        <label class="field"
          ><span>Città</span
          ><select v-model="cityId" required>
            <option
              v-for="city in cities.cities"
              :key="city.id"
              :value="city.id"
            >
              {{ city.name }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Descrizione</span
          ><textarea
            v-model="description"
            required
            minlength="15"
            maxlength="1500"
            rows="4"
          />
        </label>
        <div class="actions">
          <button :disabled="busy || !online">Salva</button
          ><button type="button" class="text-button" @click="editing = null">
            Annulla
          </button>
        </div>
      </form>
      <template v-else>
        <p class="description">{{ report.description }}</p>
        <div class="actions">
          <button
            v-if="report.status === 'pending'"
            :disabled="busy || !online"
            @click="run(() => store.approve(report.id))"
          >
            Approva e pubblica
          </button>
          <button
            v-if="report.status !== 'rejected'"
            class="text-button"
            :disabled="busy || !online"
            @click="run(() => store.reject(report.id))"
          >
            Rifiuta
          </button>
          <button
            class="text-button"
            :disabled="busy || !online"
            @click="edit(report)"
          >
            Modifica
          </button>
          <button
            class="delete"
            :disabled="busy || !online"
            @click="remove(report.id)"
          >
            Elimina
          </button>
        </div>
      </template>
    </article>
  </main>
</template>

<style scoped>
.heading,
.actions,
.tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.actions {
  justify-content: flex-start;
}
.tabs {
  background: #e7ede2;
  padding: 6px;
  border-radius: 28px;
  margin: 24px 0;
}
.tabs button {
  flex: 1;
  background: transparent;
  color: #3e4a3c;
}
.tabs .selected {
  background: #fff;
  box-shadow: 0 1px 4px #0001;
}
.delete {
  background: #ffdad6;
  color: #85251d;
}
.description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
