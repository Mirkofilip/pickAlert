<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { Capacitor } from "@capacitor/core";
import PwaStatus from "./components/PwaStatus.vue";
const isNative = Capacitor.isNativePlatform();
import BottomNav from "./components/BottomNav.vue";
const auth = useAuthStore();
const brandIcon = `${import.meta.env.BASE_URL}pickalert-icon.png`;
const route = useRoute();
const showReportAction = computed(() =>
  ["/", "/info", "/impostazioni"].includes(route.path),
);
</script>
<template>
  <div class="app-shell" :class="{ 'has-report-action': showReportAction }">
    <header class="app-bar">
      <RouterLink to="/" class="brand"
        ><img
          class="brand-symbol"
          :src="brandIcon"
          alt=""
          width="42"
          height="42"
        />PickAlert</RouterLink
      ><span class="app-caption">La tua zona, più informata</span
      ><RouterLink v-if="auth.isModerator" to="/moderazione">Modera</RouterLink>
    </header>
    <PwaStatus v-if="!isNative" />
    <RouterView /><BottomNav :show-report-action="showReportAction" />
  </div>
</template>
<style scoped>
.app-bar {
  height: 80px;
  padding: env(safe-area-inset-top) 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e6dc;
  background: #f6f8f2;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-size: 21px;
  font-weight: 700;
  color: #244e34;
}
.brand-symbol {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: 12px;
}
.app-caption {
  font-size: 12px;
  color: #626c60;
}
@media (max-width: 480px) {
  .app-caption {
    display: none;
  }
}
</style>
