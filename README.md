# Referendum 2026

Il frontend dell'applicazione si trova in `client/`.
Il backend NestJS con persistenza SQLite si trova in `server/`.

Il repository ora e configurato come monorepo `pnpm` + Turborepo.

## Avvio

```bash
pnpm install
pnpm dev
```

Il client Vite e esposto su `0.0.0.0`, quindi raggiungibile anche da altri host della rete oltre che da `localhost`.

## Build

```bash
pnpm build
pnpm typecheck
```

## Task mirati

```bash
pnpm dev:client
pnpm dev:server
```

## Server

```bash
pnpm --filter referendum2026-server dev
```

Durante lo sviluppo il client chiama il backend tramite proxy Vite su `/api`, inoltrato al server Nest su `http://localhost:3000`.

Endpoint disponibili:

- `GET /presence`
- `PUT /presence`

Il database SQLite viene salvato in `server/data/referendum.sqlite`.
