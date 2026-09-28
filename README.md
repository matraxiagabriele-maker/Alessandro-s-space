# Tuttoverde su Netlify

Agenda, clienti, cassa, ore, trattamenti e resoconto per giardiniere, con sincronizzazione tra più telefoni tramite codice o link d'invito.

## Cosa c'è nella cartella
- `public/`: l'app (index.html), icone e manifest per aggiungerla alla Home dell'iPhone
- `netlify/functions/sync.mjs`: il piccolo server che tiene i dati condivisi (usa Netlify Blobs)
- `netlify.toml` e `package.json`: configurazione

## Pubblicare
Opzione A, da terminale (consigliata):
1. `npm install -g netlify-cli`
2. dentro questa cartella: `npm install`
3. `netlify login`, poi `netlify deploy --prod` (la prima volta crea il sito)

Opzione B, da GitHub:
1. Metti la cartella in un repository GitHub (senza `node_modules`).
2. Su Netlify: Add new site, Import an existing project, scegli il repository. Non servono comandi di build.

Opzione C, trascinando la cartella su https://app.netlify.com/drop: lo zip contiene già `node_modules`, ma non l'ho potuta provare su Netlify. Se la sincronizzazione non parte, usa A o B.

Importante: la sincronizzazione funziona solo se la funzione è pubblicata. Con la sola pagina statica l'app funziona lo stesso, ma i dati restano sul telefono.

## Collegare i telefoni
1. Sul primo telefono apri il sito, poi Altro > Più telefoni > Crea archivio condiviso.
2. Copia il link d'invito e aprilo sugli altri telefoni (oppure incolla il codice in Altro > Più telefoni).
3. Da Safari: Condividi > Aggiungi a Home, per averla come app.

Chi ha il link o il codice vede e modifica tutto. Il server non salva il codice, solo un suo hash. Se il codice finisce a chi non deve averlo, crea un nuovo archivio.

## Note tecniche
- Ogni modifica si sincronizza in pochi secondi, quando l'app si riapre e ogni 30 secondi mentre è aperta.
- Se due telefoni modificano lo stesso record insieme, vince la modifica più recente. Le cancellazioni si propagano.
- Offline i dati restano sul telefono e partono appena torna la rete.
- Copia di sicurezza: Altro > Copia di sicurezza.
