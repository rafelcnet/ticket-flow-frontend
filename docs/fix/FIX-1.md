# FIX-1.md — Paginación del catálogo de eventos en `/buy`

> Fecha: 2026-09-03
> Alcance: Paso 1 del Purchase Flow (`Select Event`, Context.md 5.4 Step 1).
> Origen: pedido directo del usuario, no un ticket de `docs/tickets/`. El
> endpoint no está documentado en `docs/ticketflow-api.postman_collection.json`
> — se confirmó contra el backend real corriendo en `localhost:3000` (ver
> sección 2).

---

## 1. Qué se pidió

Igual que `/bookings` tiene paginación server-side (`SpecBookings.md` 3), el
Paso 1 de `/buy` debía tenerla también, usando:

```
GET /events/paginated?page=1&limit=6
```

6 eventos por página.

---

## 2. Contrato del endpoint — verificado contra el backend real

Como este endpoint no está en el Postman collection, se verificó
directamente contra el backend local (`docker run -p 3000:3000
debuggerbyte/ticketflow-api:latest`, ya corriendo en este entorno) antes de
asumir cualquier forma de respuesta:

```bash
curl -s "http://localhost:3000/events/paginated?page=1&limit=6" \
  -H "Authorization: Bearer <token>"
```

**200 OK** — misma forma de `pagination` que `GET /bookings` (`SpecHttp.md`
7.9):

```json
{
  "data": [ { "id": "evt-001", "venueId": "ven-001", "name": "Bad Liebre", "...": "..." } ],
  "pagination": { "page": 1, "limit": 6, "total": 20, "totalPages": 4 }
}
```

- `data[]` tiene exactamente la misma forma que el item de `GET /events`
  (`SpecHttp.md` 7.5) — no se agregó ni quitó ningún campo.
- `total: 20` confirma que sigue siendo el mismo catálogo sembrado
  (`Context.md` 4: 20 eventos).
- Sin token responde `401 UNAUTHORIZED`, igual que `GET /events` — el
  endpoint es protegido, nada nuevo que manejar en el interceptor global.

---

## 3. Cambios de arquitectura

### 3.1 `events.service` — se reemplaza el catálogo cacheado por el paginado

`SpecPurchase.md` 6 justificaba una caché en memoria porque `GET /events`
"no acepta parámetros y siempre devuelve la lista completa". Con
paginación esa premisa ya no aplica: cada página es una petición distinta
con su propio `page`/`limit`. Se elimina `getEvents()` + la caché en
memoria + `clearEventsCache()`, y se agrega:

```ts
getPaginatedEvents(page: number, limit: number): Promise<PaginatedEventsResponse>
```

Sin caché — misma decisión que ya tiene `/bookings` (cada cambio de página
repite la petición). Como consecuencia, `AppShell.tsx` ya no llama a
`clearEventsCache()` en el logout (no hay nada que invalidar).

### 3.2 `schemas/events.schema.ts`

Nuevo `PaginatedEventsResponseSchema` — reutiliza `EventSchema` para
`data[]` y define `pagination` con la misma forma que
`schemas/booking.schema.ts` (`{ page, limit, total, totalPages }`).

### 3.3 `SelectEventStep` — selección por objeto, no por id

El componente original guardaba sólo el `id` resaltado y recuperaba el
evento completo buscándolo en la lista ya cargada al pulsar Next
(`events?.find(...)`). Con paginación esto es un bug real: si el usuario
elige un evento en la página 1 y navega a la página 3 antes de pulsar
Next, ese evento ya no está en `events` (la página actual) y el `.find`
devuelve `undefined` — Next se ve habilitado pero no hace nada.

Se corrige guardando el **objeto `Event` completo** en el momento del
click (`highlightedEvent: Event | null`, no sólo su id). Así la selección
sobrevive a un cambio de página sin necesitar volver a buscarlo, y Next
siempre tiene el evento completo disponible para `SELECT_EVENT`.

### 3.4 `PaginationBar` se promueve a `components/tables/`

Ya existía en `features/bookings/` (TF-8). Al necesitarla también en
`features/purchase/select-event/`, se movió a `components/tables/`
(sin ningún cambio de comportamiento) — es 100% genérica
(`page`/`totalPages`/`onPageChange`, sin conocimiento de bookings ni de
eventos) y las features no se importan entre sí en este proyecto
(`SpecProject.md` 1: dependencia unidireccional
`components/ ← features/`). `BookingsPage.tsx` actualiza su import; su
comportamiento no cambió.

### 3.5 Qué se mantiene sin cambios

- El resto de la FSM del stepper (`purchase.reducer.ts`) — `SELECT_EVENT`
  sigue recibiendo el mismo payload (`{ event: Event }`).
- El diseño visual de las cards, el precio "Desde $XX.XX USD", las
  imágenes lazy-loaded (Context.md 10).
- El estado vacío ("No hay eventos disponibles por ahora.") para una
  página 1 sin resultados.

---

## 4. Decisión deliberada: sin parpadeo de carga entre páginas

Al cambiar de página, la grilla anterior permanece visible hasta que
llega la respuesta de la nueva página (no se limpia `events` antes de
pedir la siguiente) — sólo el primer montaje pasa por el estado de carga
("Cargando eventos…"). Esto evita un parpadeo entre páginas y, de paso,
evita disparar un `setState` síncrono al inicio del efecto (detectado por
`oxlint`, regla `react/set-state-in-effect`). No estaba pedido
explícitamente, se documenta como decisión de implementación.

---

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/services/events.service.ts` | Reemplaza `getEvents`/caché/`clearEventsCache` por `getPaginatedEvents(page, limit)` |
| `src/schemas/events.schema.ts` | Nuevo `PaginatedEventsResponseSchema` |
| `src/features/purchase/select-event/SelectEventStep.tsx` | Pagina el catálogo (6 por página), selección por objeto completo, usa `PaginationBar` |
| `src/features/home/AppShell.tsx` | Quita la llamada a `clearEventsCache()` en logout (ya no existe caché que invalidar) |
| `src/components/tables/PaginationBar.tsx` + `.module.css` | Se mueven desde `src/features/bookings/` (sin cambios de comportamiento) |
| `src/features/bookings/BookingsPage.tsx` | Actualiza el import de `PaginationBar` a su nueva ubicación |

## 6. Pendiente para la fase de tests

Estos archivos de test quedan referenciando símbolos que ya no existen
(`getEvents`, `clearEventsCache`) — es la misma dinámica ya vista en
TF-6/TF-7/TF-8 (el desarrollo deja tests desactualizados a propósito, se
corrigen en la fase de tests, no aquí):

- `src/services/events.service.test.ts` — se reescribe para `getPaginatedEvents`
- `src/features/purchase/select-event/SelectEventStep.test.tsx` — se adapta a la paginación (incluye el caso de seleccionar en una página y confirmar en otra, cubriendo el bug corregido en 3.3)
- `src/features/purchase/PurchasePage.test.tsx` — actualiza el mock de `events.service`
- `src/routes/AppRouter.test.tsx` — ídem
- `src/features/home/AppShell.test.tsx` — quita las aserciones sobre `clearEventsCache`
- `src/components/tables/PaginationBar.test.tsx` — ya existía (movido desde `features/bookings/`), sigue vigente tal cual
