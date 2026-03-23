# Referendum 2026 Client

Frontend Vite + React + Material UI per la visualizzazione delle affluenze del seggio.

## Funzionalita implementate

- Dashboard con quattro aree principali:
	- votanti `A-L`
	- votanti `M-Z`
	- totale votanti
	- percentuale su totale elettori
- Intestazione con nome del comune e sezione/seggio.
- Visualizzazione dell'ultimo rilevamento formattato per l'utente.
- Mini grafico SVG con andamento orario dell'incremento votanti.
- Aggiornamento automatico dei dati ogni 5 secondi quando si e sulla dashboard.
- Pagina impostazioni per modificare:
	- totale elettori
	- votanti `A-L`
	- votanti `M-Z`
	- comune
	- sezione / seggio
- Sanificazione dei campi numerici con blocco a valori interi non negativi.
- Stato di caricamento con barra di progresso.
- Gestione errori di caricamento e salvataggio con alert.
- Feedback di salvataggio completato con messaggio di successo.
- Pulsante fullscreen per uso da tabellone o schermo di sala.
- Routing client con pagine `/` e `/impostazioni`.

## Stack

- React 19
- React Router 7
- Vite 6
- Material UI 7
- TypeScript

## Requisiti

- Node.js 20+
- pnpm

## Avvio

```bash
cd client
pnpm install
pnpm dev
```

Apri l'URL indicato da Vite nel browser.

## Build e typecheck

```bash
cd client
pnpm build
pnpm typecheck
```

## Integrazione con il backend

- tutte le chiamate passano da `/api`
- in sviluppo il proxy Vite inoltra verso `http://localhost:3000`
- i dati non sono salvati in `localStorage`: la persistenza e gestita dal backend

## Endpoint usati dal client

- `GET /api/presence`
- `PUT /api/presence`
- `GET /api/presence/history/hourly-diff`
