# PickAlert PWA senza notifiche

## Test locale della versione installabile

```sh
npm install
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Aprire http://127.0.0.1:4173 e attendere il primo caricamento completo online.
Il service worker viene generato e registrato **solo nella build di produzione**:
`npm run dev` serve a sviluppare l'interfaccia, non a verificare l'installazione.

Da Impostazioni, Chrome/Edge compatibili possono mostrare “Installa PickAlert”.
Se il browser non espone il pulsante, usare il suo menu di installazione.
Su iPhone/iPad aprire il sito in Safari e scegliere Condividi → Aggiungi alla
schermata Home. L'installazione dipende dal browser e dal dispositivo.

## Pubblicazione

Caricare il contenuto di `dist/` su un hosting statico **HTTPS**. Non pubblicare
`.env`, `node_modules`, file di firma o chiavi private. Il browser deve poter
accedere a `/manifest.webmanifest`, `/sw.js`, alle icone e agli asset compilati.
Le chiavi VITE_SUPABASE_ANON_KEY sono pubbliche per definizione: la protezione
dei dati è nelle RLS Supabase, non nel nascondere questa chiave.

Configurare il fallback SPA verso `index.html` per le rotte dell'app, preservando
hash e query dei link di recupero password. Non riscrivere le richieste mancanti
per `sw.js`, asset JS/CSS e manifest come HTML.

Header consigliati:

- `/sw.js`, `/index.html`, `/manifest.webmanifest`: `Cache-Control: no-cache`
- `/assets/*` (nomi con hash): `Cache-Control: public, max-age=31536000, immutable`
- `X-Content-Type-Options: nosniff`

In Supabase Auth → URL Configuration, impostare Site URL sul dominio HTTPS
pubblico e autorizzare soltanto gli indirizzi di recupero effettivamente usati.
Il recupero password ora usa il Site URL e gestisce `type=recovery` nell'app.
Non cambiare questa configurazione finché non è stato scelto il dominio reale.

## Connessione, cache e aggiornamenti

- La cache contiene **solo file statici** dell'interfaccia e icone.
- Nessuna risposta Supabase, segnalazione o richiesta Auth viene memorizzata dal
  service worker; non è configurata alcuna cache runtime.
- Offline si apre l'interfaccia dopo un primo caricamento riuscito; il feed
  nasconde le segnalazioni e mostra che serve una connessione.
- Le nuove segnalazioni non vengono accodate o inviate automaticamente offline.
  Il testo può restare nella pagina aperta, ma non viene persistito tra riavvii.
- La preferenza città resta in localStorage; gli accessi dei moderatori usano
  la persistenza di sessione Supabase già presente, distinta dalla cache PWA.
- Una nuova versione mostra “Aggiorna app”; nessuna ricarica automatica mentre
  si sta compilando un modulo.
- Nessuna push, richiesta di permesso notifiche, Firebase o pubblicità nella PWA.
  I vecchi file Android/push sono conservati come materiale per un rilascio futuro,
  ma non vengono importati dal flusso web delle impostazioni.

## Verifica su dispositivi reali

1. Aprire il sito HTTPS su Chrome Android e Safari iPhone.
2. Installare e controllare nome, icona, apertura senza barra del browser.
3. Scegliere una città, chiudere e riaprire: la scelta deve restare.
4. Consultare il feed online, poi togliere la connessione: nessun vecchio avviso
   deve sembrare un dato aggiornato; il form deve impedire l'invio.
5. Riaprire l'app offline: deve apparire l'interfaccia con l'avviso di connessione.
6. Ripristinare la rete: il feed deve recuperare i dati dal server.
7. Pubblicare una nuova build: verificare l'avviso di aggiornamento e l'azione
   volontaria di ricarica, senza perdere automaticamente testo non inviato.

L'hosting pubblico, il dominio e la prova di installazione su telefoni reali non
sono compresi nel solo build locale. Non serve un APK, una firma o Firebase per
questa distribuzione PWA.

## Dipendenze di build

Il plugin PWA porta dipendenze transitive Workbox con avvisi npm audit
(2 low e 4 moderate al 12 novembre 2026). Riguardano la toolchain di build,
non codice di notifiche o API in produzione. Gli aggiornamenti compatibili
non li risolvono ancora; non è stato forzato un downgrade del plugin.

## GitHub Pages: Mirkofilip/pickAlert

Repository: https://github.com/Mirkofilip/pickAlert
URL pubblico previsto: https://mirkofilip.github.io/pickAlert/

Il workflow `.github/workflows/deploy-pages.yml` pubblica dopo ogni push su main.
Richiede Pages con Source **GitHub Actions** e due **repository variables**:
VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (chiave anon pubblica, mai service role).
Non caricare `.env`: i valori pubblici vengono passati alla build dalle variabili.

La build Pages usa base `/pickAlert/` e rotte hash, per esempio
`/pickAlert/#/impostazioni`, senza richiedere rewrite non disponibili su Pages.
Manifest, service worker e icone restano nello scope di questa sottocartella.
Il recupero password consuma l'hash Auth prima di inizializzare Vue Router.
Impostare Supabase Site URL sull'URL pubblico dopo il primo deploy riuscito.

Test della stessa build in locale, senza sostituire l'anteprima standard:

```sh
VITE_BASE_PATH=/pickAlert/ VITE_ROUTER_MODE=hash npm run build -- --outDir pages-dist
npx vite preview --outDir pages-dist --host 127.0.0.1 --port 4175
```
