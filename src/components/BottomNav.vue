<script setup>
defineProps({ showReportAction: { type: Boolean, default: false } });
</script>
<template>
  <div v-if="showReportAction" class="report-action">
    <RouterLink to="/nuova-segnalazione" class="button"
      ><span aria-hidden="true">＋</span> Segnala un episodio</RouterLink
    >
  </div>
  <nav class="bottom-nav" aria-label="Navigazione principale">
    <RouterLink to="/"><span>▤</span>Segnalazioni</RouterLink
    ><RouterLink to="/nuova-segnalazione"><span>＋</span>Segnala</RouterLink
    ><RouterLink to="/impostazioni"><span>⚙</span>Impostazioni</RouterLink
    ><RouterLink to="/info"><span>ⓘ</span>Info</RouterLink>
  </nav>
</template>
<style scoped>
.report-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  z-index: 100;
  padding: 14px 20px 12px;
  background: linear-gradient(transparent, #f6f8f2 28%);
  pointer-events: none;
}
.report-action .button {
  display: flex;
  width: 100%;
  max-width: 720px;
  min-height: 50px;
  margin: 0 auto;
  box-shadow: 0 3px 12px #204f3026;
  pointer-events: auto;
}

.bottom-nav {
  height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #eaf0e5;
  padding: 10px 8px calc(12px + env(safe-area-inset-bottom));
  z-index: 100;
  border-top: 1px solid #dfe6d9;
}
.bottom-nav a {
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  color: #50594e;
  text-decoration: none;
  font-weight: 500;
}
.bottom-nav span {
  font-size: 24px;
  padding: 2px 22px;
  border-radius: 24px;
  line-height: 28px;
}
.bottom-nav .router-link-exact-active span {
  background: #cde7ce;
  color: #204f30;
}
.bottom-nav .router-link-exact-active {
  color: #204f30;
}
</style>
