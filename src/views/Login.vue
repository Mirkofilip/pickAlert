<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
const auth = useAuthStore(),
  router = useRouter(),
  email = ref(""),
  password = ref(""),
  error = ref(""),
  loading = ref(false);
async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await auth.signIn(email.value, password.value);
    if (!auth.isModerator)
      throw new Error("Questo account non è abilitato alla moderazione.");
    await router.push("/moderazione");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <main class="page">
    <span class="eyebrow">Area riservata</span>
    <h1>Accesso moderatori</h1>
    <p class="muted">
      Per consultare e inviare segnalazioni non serve un account.
    </p>
    <form class="surface" @submit.prevent="submit">
      <label class="field"
        ><span>Email</span
        ><input
          v-model="email"
          type="email"
          autocomplete="username"
          required /></label
      ><label class="field"
        ><span>Password</span
        ><input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
      /></label>
      <p v-if="error" class="error-msg">{{ error }}</p>
      <button :disabled="loading">Accedi</button>
    </form>
    <RouterLink to="/recupera-password">Password dimenticata?</RouterLink>
  </main>
</template>
