# SpecProject.md — TicketFlow (React)

> Versión: 1.0.0
> Fuente de verdad: `Context.md` (v1.6.0) y `docs/ticketflow-api.postman_collection.json`
> Alcance de este Spec: estructura de carpetas, dependencias, convenciones de nombrado y scripts del proyecto React. **No define lógica de negocio, componentes concretos ni código** — eso corresponde a los Specs de traducción por feature (`SpecHttp.md`, `SpecAuth.md`, `SpecPurchase.md`, `SpecSeatMap.md`, `SpecBookings.md`).
> Este documento traduce a React la arquitectura de referencia framework-agnóstica de `Context.md` sección 8, respetando el nombrado ya fijado ahí (módulo de Token Storage, contrato de interceptores, slices de estado, carpetas de referencia) y la regla de dependencia unidireccional de la sección 7.3 (HTTP Client → nunca depende de Authentication).

---

## 0. Decisiones de stack asumidas para este Spec

`Context.md` (3.3) es framework-agnóstico y no fija build tool, gestor de estado ni estrategia de estilos — son decisiones de este Spec, no del PRD. Se registran aquí para que el resto de Specs generados en otros chats las hereden sin reinventarlas (mismo principio que motivó la sección 8 del PRD):

| Decisión | Elegido | Justificación |
|---|---|---|
| Librería de validación de esquemas | **Zod** | Confirmado explícitamente para este Spec. |
| Gestión de estado | **Context API + useReducer** (uno por slice de 8.4) | Sin dependencias adicionales; mapea 1:1 con las 4 slices ya nombradas (`auth`, `purchase`, `seatMap`, `bookings`) sin introducir un concepto nuevo. |
| Build tool | **Vite** | Estándar actual para SPAs de React; el PRD (sección 11) excluye SSR y PWA, por lo que un framework full-stack quedaría infrautilizado. |
| Estrategia de estilos | **CSS Modules** sobre variables CSS (custom properties) | Encaja de forma directa con los tokens Nord ya definidos como variables CSS en `Context.md` 2.2, sin dependencia adicional. |
| Cliente HTTP | **`HttpClient` propio sobre `fetch` nativo** (no Axios) | Así lo nombra el encargo y así lo trata `Context.md` sección 7–8: un módulo propio con interceptores y Token Storage, no una librería de terceros. |

**Pendiente de confirmación (no resuelto por `Context.md` ni por el encargo):** framework de testing. No se incluye como dependencia obligatoria porque ningún requisito no-funcional (sección 10) ni de alcance (sección 11) lo exige explícitamente; se deja un script `test` reservado (ver sección 5) para que el equipo lo confirme antes de fijar la librería.

---

## 1. Principio rector: Separation of Concerns

Cada carpeta de nivel superior representa **una única responsabilidad**, con una regla de dependencia unidireccional (igual que 7.3 en `Context.md`, extendida al resto del árbol):

```
components/  ←  features/  ←  state/  ←  services/  ←  schemas/  ←  http/
```

- `http/` no conoce a nadie por encima de sí mismo (ni auth, ni servicios, ni UI). Es la capa más baja, igual que exige 7.3.
- `schemas/` sólo conoce el contrato de datos (Postman). No conoce `http/` ni React.
- `services/` traduce llamadas HTTP en datos ya validados por `schemas/`. No conoce React ni el estado global.
- `state/` guarda y expone las 4 slices de 8.4. Consume `services/` pero no conoce componentes concretos.
- `features/` orquesta pantalla + interacción del usuario, consumiendo `state/` y `services/`.
- `components/` es UI compartida y "tonta": no hace fetch, no conoce slices, sólo recibe props.

Ninguna carpeta inferior en esta cadena importa desde una superior. Esto es lo que impide que se repita el ciclo circular que 7.3 tuvo que corregir entre HTTP Client y Authentication.

---

## 2. Estructura de carpetas

```
ticketflow-web/
├── public/
│   └── (favicon, assets estáticos que no pasan por el bundler)
├── src/
│   ├── main.tsx                  → punto de entrada; monta la app y los providers raíz
│   ├── App.tsx                   → composición raíz: router + providers globales
│   │
│   ├── routes/                   → definición de rutas y guardas (8.5)
│   │   ├── router config         → mapea /login, /home, /buy, /bookings
│   │   └── route guard           → resuelve por hasToken() (8.2) antes de renderizar
│   │
│   ├── http/                     → capa HTTP (7.1, 7.2, 7.3, 8.2, 8.3) — la más baja del árbol
│   │   ├── cliente HTTP base     → configuración base (baseURL, timeout, headers) de 7.2
│   │   ├── interceptor de request → adjunta Authorization leyendo el Token Storage
│   │   ├── interceptor de response → manejo global de 401/403/500 (7.1) con la excepción
│   │   │                             cerrada de POST /auth/login (7.1, 8.3)
│   │   └── token storage         → saveToken / getToken / clearToken / hasToken (8.2) —
│   │                                interfaz de referencia fija, no se renombra ni se
│   │                                redefine fuera de aquí
│   │
│   ├── schemas/                  → un esquema Zod por recurso del contrato Postman
│   │   ├── auth                  → login (request/response), sesión
│   │   ├── user                  → GET /users/me
│   │   ├── events                → GET /events
│   │   ├── seat-map              → GET /events/:id/seats (zonas + asientos)
│   │   ├── payment               → POST /payment/process
│   │   ├── booking               → POST /bookings, GET /bookings, PATCH cancel
│   │   └── api-error             → forma común de error `{ error, message }` (ver Postman:
│   │                                "Error shape (all errors)")
│   │
│   ├── services/                 → uno por recurso (8.1) — usa http/ + valida con schemas/
│   │   ├── auth.service          → login, logout
│   │   ├── users.service         → perfil autenticado
│   │   ├── events.service        → listado de eventos
│   │   ├── seats.service         → mapa de asientos por evento
│   │   ├── payment.service       → procesamiento simulado de pago
│   │   └── bookings.service      → crear, listar (con filtros/paginación), cancelar
│   │
│   ├── state/                    → las 4 slices de referencia (8.4), ni una más ni una menos
│   │   ├── auth                  → user, isAuthenticated — consumida por Home (sidebar) y
│   │   │                            por las guardas de ruta
│   │   ├── purchase               → selectedEvent, contactDetails, selectedSeat,
│   │   │                            paymentResult — consumida por los 5 pasos de /buy
│   │   ├── seat-map               → zones, seats, selectedSeatId — consumida por el Paso 3
│   │   └── bookings               → filters, page, limit, items — consumida por /bookings
│   │
│   ├── features/                 → una carpeta por pantalla/flujo (8.1), UI + orquestación
│   │   ├── login                 → pantalla /login (5.2)
│   │   ├── home                  → layout de navegación + perfil (5.3)
│   │   ├── purchase               → stepper de 5 pasos (5.4), un subgrupo por paso:
│   │   │                            select-event, your-details, select-seat, payment,
│   │   │                            confirmation
│   │   └── bookings               → listado, filtros, paginación, cancelación (5.5)
│   │
│   ├── components/               → UI compartida y agnóstica de negocio (8.1)
│   │   ├── layout                 → shell de sidebar/bottom-nav, contenedor de páginas
│   │   ├── cards                  → tarjeta de evento y afines
│   │   ├── tables                 → tabla genérica reutilizable (usada por bookings)
│   │   ├── badges                 → badge de estado (confirmed/pending/cancelled)
│   │   └── feedback                → estados vacíos, spinners, toasts (403/500 de 7.1)
│   │
│   ├── hooks/                     → hooks compartidos entre features (no específicos de uno)
│   │
│   ├── styles/                    → tokens Nord como variables CSS (2.2), reset, tipografía
│   │                                 (Inter / JetBrains Mono)
│   │
│   ├── config/                    → constantes de configuración (baseURL, timeout, service
│   │                                 fee, tamaño de página por defecto) — sin lógica
│   │
│   └── assets/                    → recursos estáticos importados por el bundler
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config
└── .eslintrc / .prettierrc
```

**Regla de traducción para los Specs siguientes:** ningún Spec de feature (`SpecAuth.md`, `SpecPurchase.md`, `SpecSeatMap.md`, `SpecBookings.md`) crea carpetas nuevas de nivel superior ni renombra las anteriores. Si necesita algo que no está aquí, lo señala como pendiente en vez de inventarlo — mismo criterio que exige `Context.md` sección 8 para nombres, campos y funciones.

---

## 3. Convenciones de nombrado

### 3.1 Carpetas
- `kebab-case` en todas las carpetas (`seat-map`, `select-event`), sin excepciones.
- Nombre en plural cuando la carpeta agrupa múltiples unidades del mismo tipo (`services/`, `schemas/`, `components/`); en singular cuando agrupa las partes de una sola responsabilidad (`state/` es la excepción consciente: conserva el término "slice" de 8.4 en su contenido, no en el nombre de carpeta).
- Cada carpeta de `features/` y de `state/` usa exactamente los nombres ya fijados en `Context.md` 8.1/8.4 (`auth`, `purchase`, `seat-map` como equivalente kebab-case de `seatMap`, `bookings`, `login`, `home`). Ningún Spec los traduce de otra forma.

### 3.2 Archivos por tipo (sufijo obligatorio)
| Capa | Sufijo de archivo | Ejemplo de nombre (sin extensión) |
|---|---|---|
| Cliente/interceptores HTTP | `.client` / `.interceptor` | `http.client`, `auth.interceptor` |
| Token Storage | `.storage` | `token.storage` |
| Esquema Zod | `.schema` | `booking.schema` |
| Servicio | `.service` | `bookings.service` |
| Slice de estado | `.context` (provider) + `.reducer` | `purchase.context`, `purchase.reducer` |
| Hook compartido | prefijo `use` | `useAuth`, `usePagination` |
| Tipos derivados no cubiertos por Zod | `.types` | `booking.types` |
| Configuración | `.config` | `http.config` |

### 3.3 Componentes React
- `PascalCase`, un componente exportado por archivo, nombre de archivo = nombre de componente (`EventCard`, `StatusBadge`, `SeatMapArena`).
- Los tres layouts del Paso 3 (5.4: arena, halfmoon, flat) siguen el patrón `SeatMap<VenueType>` para que el componente condicional de `features/purchase/select-seat` los resuelva por convención a partir del `venueType` devuelto por `GET /events/:id/seats` — sin inventar un cuarto layout ni renombrar los tres ya definidos en el PRD.

### 3.4 Esquemas Zod y tipos inferidos
- Constante de esquema: `PascalCase` + sufijo `Schema` (`LoginResponseSchema`, `SeatMapResponseSchema`).
- Tipo inferido del esquema: mismo nombre sin el sufijo `Schema` (`LoginResponse`, `SeatMapResponse`), nunca un nombre distinto al del esquema del que proviene — así se evita la ambigüedad de forma de datos que motivó la sección 3.2.1 del PRD.
- Un esquema por endpoint documentado en el Postman collection; ningún esquema describe un campo que no esté en un ejemplo de request/response de ese archivo.

### 3.5 Servicios y funciones expuestas
- El archivo de servicio se nombra por recurso, no por endpoint (`bookings.service`, no `create-booking.service`).
- Las funciones que expone un servicio se nombran por acción sobre el recurso (verbo + recurso), evitando duplicar el nombre del archivo.

### 3.6 Slices de estado
- Cada slice usa como identificador exactamente el nombre de 8.4 (`auth`, `purchase`, `seatMap`, `bookings`), incluso si el archivo vive en una carpeta kebab-case (`state/seat-map/seat-map.reducer` expone la slice `seatMap`).
- Ningún Spec de feature crea una slice adicional ni divide una existente sin actualizar antes este documento.

---

## 4. Dependencias

### 4.1 Producción
| Paquete | Responsabilidad | Capa que lo usa |
|---|---|---|
| `react`, `react-dom` | Librería de UI base | `features/`, `components/`, `App.tsx` |
| `react-router-dom` | Enrutamiento cliente y guardas de ruta (5.1, 8.5) | `routes/` |
| `zod` | Definición y validación de los esquemas de datos del contrato Postman (3.2.1) | `schemas/` |

**No se incluye ninguna librería de cliente HTTP (Axios u otra):** la sección 7 del PRD define el HTTP Client como un módulo propio del proyecto, no como una dependencia externa; usarlo sería redefinir en el Spec algo que el PRD ya cerró.

**No se incluye ninguna librería de gestión de estado externa** (Redux, Zustand, Jotai, etc.): la decisión registrada en la sección 0 usa Context API + `useReducer`, ya incluidos en `react`.

### 4.2 Desarrollo
| Paquete | Responsabilidad |
|---|---|
| `vite`, `@vitejs/plugin-react` | Build tool y servidor de desarrollo |
| `typescript` | Tipado estático del proyecto |
| `eslint` + plugins de React/TypeScript | Linter y reglas de consistencia de código |
| `prettier` | Formateo automático |

### 4.3 Tipografía
- Inter (headings/body) y JetBrains Mono (IDs de reserva) se declaran en `Context.md` 2.2 como fuentes de Google Fonts — se cargan como recurso de fuente (enlace o paquete de fuente autoalojada), no como dependencia de lógica. La decisión de cómo se sirven (enlace externo vs. autoalojada) queda pendiente de confirmación; no está fijada por el PRD.

### 4.4 Pendiente de confirmación
- Librería de testing (unit/component) — sin definir, ver sección 0.
- Librería de manejo de formularios (por ejemplo, para los formularios de Login, Step 2 y Step 4) — el PRD no exige una en concreto; Zod puede validar sin depender de ninguna, así que esta decisión se deja abierta para el Spec de la feature correspondiente en vez de fijarla aquí sin necesidad.

---

## 5. Scripts

| Script | Propósito |
|---|---|
| `dev` | Levanta el servidor de desarrollo con recarga en caliente |
| `build` | Compila tipos y genera el bundle de producción |
| `preview` | Sirve localmente el resultado de `build` para verificación previa a despliegue |
| `lint` | Ejecuta ESLint sobre todo `src/` |
| `format` | Aplica Prettier sobre todo `src/` |
| `type-check` | Verifica tipos con TypeScript sin emitir archivos |
| `test` | Reservado — se activa cuando se confirme la librería de testing (sección 4.4) |

---

## 6. Trazabilidad con el contrato Postman

Toda carpeta que toca datos de red (`schemas/`, `services/`) se corresponde 1:1 con una carpeta o item del Postman collection:

| Carpeta Postman | Servicio | Esquema(s) |
|---|---|---|
| Auth | `auth.service` | esquema de login (request/response) |
| Users | `users.service` | esquema de perfil |
| Events | `events.service`, `seats.service` | esquema de evento, esquema de mapa de asientos |
| Payment | `payment.service` | esquema de request/response de pago |
| Bookings | `bookings.service` | esquema de creación, esquema de listado+paginación, esquema de cancelación |

El esquema de error común (`api-error`) cubre la forma `{ error, message }` documentada en la descripción de la colección ("Error shape (all errors)") y es consumido únicamente por la capa `http/`, que es la única responsable de interpretar el código HTTP genérico (7.1). La interpretación de los códigos de negocio específicos (tabla de errores de negocio, 3.2.1) ocurre en la capa `services/` o `features/`, nunca en `http/` — así se mantiene la separación entre manejo genérico de transporte y manejo de reglas de negocio.

---

## 7. Qué queda fuera de este Spec

Por alcance, no se definen aquí (se resuelven en los Specs correspondientes):
- La forma exacta de los interceptores y su integración con el router para la redirección en 401 (`SpecHttp.md`).
- Los campos y validaciones concretas de cada esquema Zod (`SpecHttp.md`, `SpecAuth.md`, `SpecPurchase.md`, `SpecSeatMap.md`, `SpecBookings.md`, según el recurso).
- La lógica del stepper de compra y las tres variantes de mapa de asientos (`SpecPurchase.md`, `SpecSeatMap.md`).
- Los filtros, paginación y actualización optimista de `/bookings` (`SpecBookings.md`).

Este documento sólo fija el esqueleto del proyecto: dónde vive cada cosa, cómo se llama y con qué se construye.