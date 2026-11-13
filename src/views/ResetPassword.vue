<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { supabase } from "../lib/supabase";

const auth = useAuthStore();
const email = ref("");
const password = ref("");
const confirmation = ref("");
const busy = ref(false);
const error = ref("");
const sent = ref(false);
const done = ref(false);

async function requestRecovery() {
  busy.value = true;
  error.value = "";
  try {
    // Use the configured Supabase Site URL as the callback destination.
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
      email.value.trim(),
    );
    if (recoveryError) throw recoveryError;
    sent.value = true;
  } catch (e) {
    error.value = e.message || "Invio non riuscito. Riprova.";
  } finally {
    busy.value = false;
  }
}

async function updatePassword() {
  error.value = "";
  if (password.value.length < 12) {
    error.value = "Scegli una password di almeno 12 caratteri.";
    return;
  }
  if (password.value !== confirmation.value) {
    error.value = "Le due password non coincidono.";
    return;
  }
  busy.value = true;
  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value,
    });
    if (updateError) throw updateError;
    password.value = "";
    confirmation.value = "";
    done.value = true;
    await auth.signOut();
  } catch (e) {
    error.value =
      e.message || "Aggiornamento non riuscito. Richiedi un nuovo link.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="page">
    <span class="eyebrow">Area riservata</span>
    <h1>Recupera la password</h1>
    <section v-if="done" class="surface">
      <h2>Password aggiornata</h2>
      <p>Ora puoi accedere alla moderazione con la nuova password.</p>
      <RouterLink to="/login" class="button">Vai all’accesso</RouterLink>
    </section>
    <form
      v-else-if="auth.isLoggedIn"
      class="surface"
      @submit.prevent="updatePassword"
    >
      <p>Scegli una nuova password personale. Non condividerla nella chat.</p>
      <label class="field"
        ><span>Nuova password</span
        ><input
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          minlength="12"
          maxlength="128"
      /></label>
      <label class="field"
        ><span>Conferma nuova password</span
        ><input
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          required
          minlength="12"
          maxlength="128"
      /></label>
      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <button :disabled="busy">
        {{ busy ? "Aggiornamento…" : "Salva nuova password" }}
      </button>
    </form>
    <section v-else-if="sent" class="surface" role="status">
      <h2>Controlla la posta</h2>
      <p>
        Se l’indirizzo è associato a un account, riceverai un link per scegliere
        una nuova password. Controlla anche la cartella spam.
      </p>
    </section>
    <form v-else class="surface" @submit.prevent="requestRecovery">
      <p>
        Inserisci l’email del tuo account moderatore. Ti invieremo un link per
        scegliere una nuova password.
      </p>
      <label class="field"
        ><span>Email del moderatore</span
        ><input v-model="email" type="email" autocomplete="email" required
      /></label>
      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
      <button :disabled="busy">
        {{ busy ? "Invio…" : "Invia link di recupero" }}
      </button>
    </form>
  </main>
</template>
