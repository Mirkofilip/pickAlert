<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
const props = defineProps({ report: { type: Object, required: true } }),
  now = ref(Date.now());
let timer;
const locationTypes = {
  citta: "Via o piazza",
  metro: "Metropolitana",
  stazione_treni: "Stazione ferroviaria",
  altro: "Altro luogo pubblico",
};
const locationType = computed(
  () => locationTypes[props.report.location_type] || null,
);
onMounted(() => {
  timer = setInterval(() => (now.value = Date.now()), 10000);
});
onUnmounted(() => clearInterval(timer));
const minutes = computed(() =>
  Math.max(
    0,
    Math.ceil(
      (new Date(props.report.expires_at).getTime() - now.value) / 60000,
    ),
  ),
);
const time = computed(() =>
  minutes.value >= 60
    ? `${Math.floor(minutes.value / 60)} h ${minutes.value % 60} min`
    : `${minutes.value} min`,
);
</script>
<template>
  <article v-if="minutes > 0" class="surface report-card">
    <div class="card-top">
      <span class="chip">✓ Approvata dalla moderazione</span
      ><span class="expiry">Ancora {{ time }}</span>
    </div>
    <h2>{{ report.location_label || "Episodio di borseggio" }}</h2>
    <span v-if="locationType" class="chip location-type">{{ locationType }}</span>
    <p>{{ report.description }}</p>
    <small
      >Pubblicata
      {{
        new Date(report.approved_at || report.created_at).toLocaleTimeString(
          "it-IT",
          { hour: "2-digit", minute: "2-digit" },
        )
      }}</small
    >
  </article>
</template>
<style scoped>
.report-card {
  margin: 0;
}
.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.card-top .chip {
  color: #285339;
  background: #e3f1e1;
}
.expiry {
  font-size: 12px;
  color: #626c60;
}
.location-type {
  color: #366749;
  background: #edf2e8;
}
.report-card p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.report-card h2 {
  margin-bottom: 8px;
}
</style>
