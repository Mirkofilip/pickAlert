<template>
  <main class="page">
    <span class="eyebrow">Informazioni</span>
    <h1>Più attenzione, insieme.</h1>
    <section class="surface">
      <h2>Come funziona</h2>
      <p>
        Scegli la città nelle impostazioni. Invia una segnalazione su un
        episodio di borseggio in un luogo pubblico: un moderatore la verifica.
        Dopo l’approvazione appare nel feed della città per 4 ore. Consulta gli
        avvisi aprendo l’app: questa versione non invia notifiche.
      </p>
      <p>
        PickAlert non sostituisce le autorità. Non intervenire e non seguire
        persone sulla base degli avvisi.
      </p>
      <a href="tel:112" class="button">Emergenza · Chiama 112</a>
    </section>
    <section class="surface">
      <h2>Dati essenziali</h2>
      <p>
        Non serve un account e non chiediamo nome, email, foto o posizione GPS.
        Non inserire dati personali nel testo delle segnalazioni.
      </p>
      <p>
        La preferenza della città resta sul dispositivo. Non usiamo token push o
        tracciamento pubblicitario. I fornitori possono trattare log tecnici di
        connessione.
      </p>
      <p>
        Le segnalazioni approvate scompaiono dopo 4 ore. Quelle in attesa o
        rifiutate scadono entro 24 ore; la pulizia del database avviene ogni 15
        minuti.
      </p>
      <p class="muted">
        L’informativa completa con titolare, contatti, fornitori e tempi dei log
        deve essere pubblicata prima del rilascio.
      </p>
    </section>
    <RouterLink to="/login">Accesso moderatori →</RouterLink>
  </main>
</template>
