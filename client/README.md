# Referendum 2026 Client

Applicazione Vite + React con Material Design per mostrare:

- Votanti A-L
- Votanti M-Z
- Totale
- Percentuale su totale elettori (XXX)

Include una pagina di impostazioni per aggiornare:

- Totale elettori
- Totale votanti A-L
- Totale votanti M-Z

## Requisiti

- Node.js 20+
- pnpm

## Avvio

Dal root del repository:

```bash
cd client
pnpm install
pnpm dev
```

Apri l'URL indicato da Vite nel browser.

## Persistenza dati

I valori sono salvati in `localStorage` nel browser.
