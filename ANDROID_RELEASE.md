# Android: Firebase e firma

Il progetto nativo è in `android/`. App ID provvisorio: **it.pickalert.app**.
Confermare l'identificativo prima di registrarlo in Firebase e Google Play: dopo
la pubblicazione non si può cambiare l'identità dell'app.

## Prerequisiti

- Node 24 LTS; Android Studio con JDK 21 e Android SDK 36.
- Progetto Firebase, piano gratuito sufficiente per Cloud Messaging.
- Keystore di upload personale, conservato fuori dal repository con backup sicuro.

## Firebase

1. Creare un progetto Firebase **senza Google Analytics**.
2. Aggiungere un'app Android con package `it.pickalert.app` (o quello definitivo,
   aggiornando config Capacitor, namespace/applicationId, MainActivity e strings).
3. Scaricare `google-services.json` in `android/app/`. È escluso dal repository.
4. Abilitare Firebase Cloud Messaging HTTP v1.
5. Generare un service account dedicato con i soli permessi di invio FCM.
   Salvare il JSON completo come secret **FIREBASE_SERVICE_ACCOUNT** su Supabase.
   Non metterlo nel frontend, in `.env` con prefisso VITE o nel repository.
6. Creare un secret casuale **REPORT_WEBHOOK_SECRET**, lungo almeno 32 byte.
7. Distribuire `notify-report` con verifica JWT del gateway disabilitata
   (`supabase functions deploy notify-report --no-verify-jwt`): la funzione
   controlla direttamente l'header `x-webhook-secret`.
8. Creare un Database Webhook su `public.reports`, evento UPDATE, URL della
   funzione `notify-report`, header `x-webhook-secret` uguale al secret.
   Non includere il secret nell'URL. Vengono notificati solo i passaggi ad approved.
9. Eseguire prima la migrazione `supabase/migration_004_private_city_alerts.sql`.

Il dispositivo si iscrive al topic `city_<UUID città>`. Cambiare città rimuove
prima l'iscrizione precedente. Nessun token viene salvato nel database applicativo.
L'avvio automatico FCM e Analytics sono disattivati nel manifest; il token viene
richiesto solo su attivazione esplicita. Firebase può comunque trattare dati
tecnici di installazione/connessione: l'app non va descritta come “zero dati”.
Il web permette il feed, la segnalazione e la preferenza della città, ma non push.

## Keystore e compilazione

Creare la chiave dal terminale personale (le password vengono chieste interattivamente):

```sh
keytool -genkeypair -v -keystore /percorso/sicuro/pickalert-upload.jks -alias pickalert-upload -keyalg RSA -keysize 2048 -validity 10000
```

Copiare `android/keystore.properties.example` in `android/keystore.properties`,
compilare percorso assoluto, alias e password. Non condividere questo file.

```sh
npm run android:apk
npm run android:aab
```

Output:

- APK firmato: `android/app/build/outputs/apk/release/app-release.apk`
- AAB firmato per Google Play: `android/app/build/outputs/bundle/release/app-release.aab`

Gli script interrompono il rilascio se mancano Firebase o la firma.
Per Google Play usare **AAB** e Play App Signing. Incrementare `versionCode`
in `android/app/build.gradle` a ogni nuovo caricamento.

## Prova su dispositivo prima del rilascio

1. Scegliere Milano e attivare le push su un telefono; scegliere Roma su un secondo.
2. Inviare una segnalazione per Milano: non deve comparire o notificare prima dell'approvazione.
3. Approvarla: deve arrivare solo a Milano, anche con app in background.
4. Modificare il testo già approvato: non deve generare una seconda push.
5. Passare da Milano a Roma: gli avvisi successivi di Milano non devono arrivare.
6. Disattivare le push: nessun nuovo avviso deve arrivare.
7. Verificare rimozione dal feed esattamente dopo 4 ore dall'approvazione.
8. Provare rete assente, permesso negato, riavvio e reinstallazione.

## Prima dello store

Pubblicare una privacy policy reale con titolare, contatti, Firebase/Supabase,
log dei fornitori, conservazione e diritti; completare Data Safety sulla base della
configurazione effettiva. Disabilitare le registrazioni pubbliche in Supabase Auth.
Creare gli account dei moderatori dalla dashboard e assegnare il ruolo dal server.
Predisporre un contatto reale per abusi/rimozioni; applicare limiti anti-spam
all'invio pubblico prima di un rilascio aperto. Le chiavi, Firebase e la firma
non sono stati creati automaticamente.

Riferimenti: https://developer.android.com/studio/publish/app-signing
https://capawesome.io/docs/sdks/capacitor/firebase/cloud-messaging/
https://firebase.google.com/docs/cloud-messaging/send-topic-messages
