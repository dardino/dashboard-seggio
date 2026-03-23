# Referendum 2026 Server

Backend NestJS per la gestione delle affluenze del seggio.

## Funzionalita implementate

- API REST per leggere e aggiornare lo stato corrente delle affluenze.
- Storico dei salvataggi in tabella dedicata `presence_history`.
- Persistenza locale su SQLite tramite `sql.js`.
- Creazione automatica del database e delle tabelle al bootstrap.
- Migrazione leggera dello schema con `ensureColumn` per colonne aggiunte successivamente.
- Validazione input con `class-validator`.
- `ValidationPipe` globale con `whitelist`, `forbidNonWhitelisted` e `transform`.
- Endpoint di aggregazione oraria con bucket sull'ultima lettura disponibile per ogni ora.
- Esclusione delle ore di chiusura `00:00`-`06:59` nell'endpoint aggregato per orario.

## Requisiti

- Node.js 20+
- pnpm

## Avvio in sviluppo

```bash
cd server
pnpm install
pnpm dev
```

Il server ascolta sulla porta `3000`, a meno che non venga impostata la variabile `PORT`.

## Build e typecheck

```bash
cd server
pnpm build
pnpm typecheck
```

## Persistenza

- file database: `server/data/referendum.sqlite`
- tabella `presence`: snapshot corrente mostrata in dashboard
- tabella `presence_history`: cronologia completa dei salvataggi

Ogni `PUT /presence`:

- aggiorna o crea il record corrente con `id = 1`
- salva una nuova riga nello storico
- aggiorna `lastUpdatedAt` con timestamp ISO

## Endpoint

### `GET /presence`

Restituisce lo stato corrente:

```json
{
  "totalElectors": 1000,
  "votersAL": 0,
  "votersMZ": 0,
  "comune": "San Giuliano Milanese",
  "sezione": "Seggio 6",
  "lastUpdatedAt": null
}
```

### `PUT /presence`

Accetta:

```json
{
  "totalElectors": 1000,
  "votersAL": 120,
  "votersMZ": 115,
  "comune": "San Giuliano Milanese",
  "sezione": "Seggio 6"
}
```

Vincoli:

- `totalElectors`, `votersAL`, `votersMZ` devono essere interi maggiori o uguali a `0`
- `comune` e `sezione` devono essere stringhe

### `GET /presence/history`

Restituisce la cronologia completa ordinata per `recordedAt` crescente.

### `GET /presence/history/hourly-diff`

Restituisce una serie aggregata per ora con:

- `hourKey`: chiave nel formato `DDMMYY-HH`
- `recordedTotal`: totale cumulativo registrato nell'ora
- `diffFromPreviousHour`: incremento rispetto all'ora precedente disponibile

Se in una certa ora non ci sono letture, il totale viene mantenuto e la differenza vale `0`.
Le ore notturne `00`-`06` vengono escluse dalla serie.
