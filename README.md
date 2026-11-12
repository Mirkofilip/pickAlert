# PickAlert

PWA Vue 3 + Supabase, installabile dalla schermata Home **senza notifiche push**.
La città viene scelta nelle impostazioni; il feed si aggiorna mentre l'app è
aperta e connessa. Interfaccia ispirata a Material Design 3 e icona PickAlert.

Le segnalazioni sono testuali, senza GPS, foto o identità dell'autore. Un
moderatore deve approvarle; da quel momento sono visibili per **4 ore**.
Non serve un account pubblico. L'accesso resta riservato ai moderatori, con
recupero password via email. Supabase e l'hosting possono trattare log tecnici:
serve un'informativa coerente con la configurazione reale di produzione.

## Locale

```sh
npm install
npm run dev
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Usare Node 24 LTS. `.env` richiede VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
Non inserire chiavi service role o altri segreti nel frontend.

La build genera manifest e service worker. Il service worker è disabilitato
nel server di sviluppo per evitare cache vecchie durante le modifiche.
Per verificare la PWA usare **build + preview**, non `npm run dev`.

## Installazione e pubblicazione

Vedi [PWA_DEPLOY.md](PWA_DEPLOY.md) per installazione Android/iPhone, HTTPS,
configurazione hosting, recupero password, cache, aggiornamenti e test offline.
La cache contiene solo l'interfaccia: i dati delle segnalazioni richiedono rete
e non vengono memorizzati dal service worker. Gli invii offline sono disabilitati.

## Database

La migrazione `supabase/migration_004_private_city_alerts.sql` è stata applicata
al progetto PickAlert il 12 novembre 2026. Impone lo stato pending e la scadenza
sul server, protegge i ruoli, abilita Realtime e chiude i vecchi upload pubblici.

Su database nuovo applicare nell'ordine schema.sql, fix_rls_recursion.sql,
migration_002_features.sql, migration_003_geolocated_push.sql, migration_004_private_city_alerts.sql.
Disabilitare il signup pubblico da Supabase Auth. I moderatori vengono creati
manualmente dall'operatore con profilo role moderator/admin.

Le segnalazioni in attesa scadono dopo 24 ore; all'approvazione la scadenza
diventa approvazione + 4 ore. Il cron elimina le righe scadute ogni 15 minuti.
I vecchi file fotografici richiedono una bonifica separata e restano in un bucket
privato. La funzione cleanup-expired è una utility protetta per quella bonifica.

## Materiale Android conservato

Il progetto Capacitor, `ANDROID_RELEASE.md` e il codice Firebase precedente sono
conservati per una futura distribuzione Android. Non sono necessari per avviare,
installare o pubblicare la PWA. Le push non vengono attivate dalla versione web.
