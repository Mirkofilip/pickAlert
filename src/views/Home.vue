<script setup>
import { onMounted, onUnmounted, computed, watch } from "vue";
import { useReportsStore } from "../stores/reports";
import { useCitiesStore } from "../stores/cities";
import { useNetworkStatus } from "../composables/useNetworkStatus";
const { online } = useNetworkStatus();
import ReportCard from "../components/ReportCard.vue";
const reports = useReportsStore(),
  cities = useCitiesStore();
const city = computed(() =>
  cities.cities.find((c) => c.id === cities.selectedCityId),
);
let timer;
function refresh() {
  if (online.value) reports.fetchReports(cities.selectedCityId);
}
onMounted(async () => {
  if (online.value) {
    await cities.fetchCities();
    refresh();
    reports.subscribeRealtime(cities.selectedCityId);
  }
  timer = setInterval(refresh, 30000);
});
watch(
  () => cities.selectedCityId,
  () => {
    refresh();
    reports.subscribeRealtime(cities.selectedCityId);
  },
);
watch(online, (connected) => {
  if (connected) {
    cities.fetchCities();
    refresh();
    reports.subscribeRealtime(cities.selectedCityId);
  } else {
    reports.fetchReports(null);
    reports.unsubscribeRealtime();
  }
});
onUnmounted(() => {
  clearInterval(timer);
  reports.unsubscribeRealtime();
});
</script>
<template>
  <main class="page">
    <span class="eyebrow">Vicino a te</span>
    <h1>{{ city?.name || "Scegli la tua zona" }}</h1>
    <p class="muted">
      Segnalazioni di borseggio approvate dalla moderazione.<br />Visibili per 4
      ore, per tenerti aggiornato.
    </p>
    <section class="area-card">
      <div>
        <span class="chip">● Zona selezionata</span>
        <h2>{{ city?.name || "Nessuna zona" }}</h2>
        <p>Consulta gli avvisi della città che scegli.</p>
      </div>
      <RouterLink to="/impostazioni" class="button"
        >{{ city ? "Cambia zona" : "Scegli zona" }} ↗</RouterLink
      >
    </section>
    <div class="section-heading">
      <h2>
        Segnalazioni attive
        <span class="chip">{{ reports.reports.length }}</span>
      </h2>
      <button class="text-button" :disabled="!online" @click="refresh">
        Aggiorna
      </button>
    </div>
    <div v-if="!online" class="empty">
      <h2>Gli avvisi aggiornati richiedono internet</h2>
      <p class="muted">
        Non mostriamo segnalazioni salvate offline, perché potrebbero essere già
        scadute.
      </p>
    </div>
    <p v-if="reports.error && online" class="error-msg" role="alert">
      {{ reports.error }}
    </p>
    <p v-if="online && reports.loading" class="muted">Caricamento…</p>
    <div v-else-if="online && !reports.reports.length" class="empty">
      <h2>{{ city ? "Nessuna segnalazione attiva" : "Da dove iniziamo?" }}</h2>
      <p class="muted">
        {{
          city
            ? "Qui compariranno le segnalazioni approvate per la tua zona."
            : "Scegli una città nelle impostazioni per vedere gli avvisi."
        }}
      </p>
    </div>
    <div v-else-if="online" class="reports-grid">
      <ReportCard v-for="r in reports.reports" :key="r.id" :report="r" />
    </div>
    <p class="muted safety-note">
      Se sei in pericolo immediato, chiama il <a href="tel:112">112</a>.
    </p>
  </main>
</template>
<style scoped>
.area-card {
  background: #d5ebd7;
  padding: 24px;
  border-radius: 28px;
  margin: 28px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.area-card h2 {
  font-size: 28px;
  margin: 12px 0 4px;
}
.area-card p {
  font-size: 14px;
  margin: 0;
}
.area-card .chip {
  background: #e9f6e9;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-heading h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.reports-grid {
  display: grid;
  gap: 16px;
}
.safety-note {
  text-align: center;
  font-size: 12px;
}
</style>
