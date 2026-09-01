# TicketFlow — Frontend (React)

Plataforma de compra de tickets: login, catálogo de eventos, selección de asiento,
pago simulado y gestión de reservas.

## Requisitos

- Node.js **22.23.2** (fijado en `.nvmrc`; Vite 8 exige `>=22.12`)
- npm

## Puesta en marcha

```bash
nvm use               # usa la versión de .nvmrc
npm install
cp .env.example .env   # opcional: el valor por defecto ya apunta a localhost:3000
npm run dev
```

## Entorno

El backend contra el que se comunica la app se resuelve desde `VITE_API_BASE_URL`
(ver `.env.example`), con `http://localhost:3000` como valor por defecto
(`src/config/http.config.ts`).

## Scripts

| Script | Propósito |
|---|---|
| `dev` | Servidor de desarrollo con HMR |
| `build` | Verifica tipos y genera el bundle de producción |
| `preview` | Sirve localmente el resultado de `build` |
| `lint` | Ejecuta Oxlint sobre `src/` |
| `format` | Aplica Prettier sobre `src/` |
| `type-check` | Verifica tipos sin emitir archivos |
| `test` | Reservado — pendiente de confirmar la librería de testing (SpecProject 4.4) |

## Documentación

- `Context.md` — PRD y fuente de verdad del producto
- `docs/Spec*.md` — arquitectura por feature
- `docs/tickets/TF-00X.md` — tareas concretas
