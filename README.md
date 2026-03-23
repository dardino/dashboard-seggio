# Referendum 2026

Monorepo `pnpm` + Turborepo per il monitoraggio delle affluenze di seggio.

## Struttura

- `client/`: applicazione Vite + React + Material UI.
- `server/`: API NestJS con persistenza SQLite tramite `sql.js`.

## Funzionalita implementate

- Dashboard con metriche separate per votanti `A-L` e `M-Z`.
- Calcolo automatico di totale votanti e percentuale sul totale elettori.
- Visualizzazione di comune, sezione/seggio e timestamp dell'ultimo rilevamento.
- Mini grafico con differenza oraria dei votanti basato sulla cronologia dei salvataggi.
- Aggiornamento automatico della dashboard ogni 5 secondi.
- Modalita fullscreen per la visualizzazione del tabellone.
- Pagina impostazioni per aggiornare elettori, votanti, comune e sezione.
- Persistenza server-side su database SQLite in `server/data/referendum.sqlite`.
- Storico completo dei salvataggi con endpoint dedicati.
- Aggregazione oraria che ignora le ore di chiusura `00:00`-`06:59`, mantenendo valido l'ultimo rilevamento delle `23:00` e riprendendo dalle `07:00`.
- Validazione input lato server con `class-validator` e `ValidationPipe` globale.

## Requisiti

- Node.js 20+
- pnpm

## Avvio rapido

```bash
pnpm install
pnpm dev
```

Questo comando avvia client e server in parallelo.

Durante lo sviluppo:

- il client Vite e esposto su `0.0.0.0`
- il client chiama il backend tramite proxy su `/api`
- il proxy inoltra verso `http://localhost:3000`

## Comandi utili

```bash
pnpm dev
pnpm dev:client
pnpm dev:server
pnpm build
pnpm typecheck
```

## API disponibili

- `GET /presence`: stato corrente dei dati esposti in dashboard.
- `PUT /presence`: aggiornamento dei dati correnti e registrazione nello storico.
- `GET /presence/history`: elenco cronologico dei salvataggi effettuati.
- `GET /presence/history/hourly-diff`: serie aggregata per ora con differenza rispetto all'ora precedente.

## Documentazione pacchetti

- vedi `client/README.md` per il frontend
- vedi `server/README.md` per il backend
