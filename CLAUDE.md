# CLAUDE.md — TicketFlow (Frontend · react)
## Proyecto
Plataforma de compra de tickets: login, catálogo de eventos, selección de
asiento, pago simulado y gestión de reservas.
Framework: **react**.
---
## Método de trabajo — Spec-Driven Development
**El archivo principal de contexto se encuentra en: Context.md(raiz del proyecto)**
El proyecto vive en dos tipos de archivo, ambos en `docs/`:
- `docs/Spec*.md` — arquitectura de cada feature (entidades, reglas, contratos)
- `docs/tickets/TF-00X.md` — la tarea concreta a implementar
Ambos se pasan como argumentos en el prompt de cada tarea y son la fuente de verdad.
No inventes reglas de negocio, campos ni comportamiento que no esté en ellos.
Sigue las mejores prácticas de react — si algo no está especificado, pregúntalo en vez de decidirlo por tu cuenta.
---
## Stack
- **Framework:** react
- **HTTP client:** HttpClient
- **Validacion de formuladios:** Zod
- **Token storage:** `localStorage`
- **Renderizado:** client-side — sin SSR

---
## Backend
Base URL `http://localhost:3000` · auth `Bearer <token>`
Contrato de la API: colección Postman en la raíz del proyecto.
---
## Prohibiciones
- No inventar endpoints, campos o reglas de negocio fuera de lo indicado en el Spec y el ticket de la tarea
- No modificar los archivos `docs/Spec*.md`
