import { EventsResponseSchema, type Event } from '../schemas/events.schema'
import { httpClient } from '../http/http.client'

/**
 * Caché en memoria del catálogo completo (SpecPurchase 6) — vive aquí, no
 * en la slice `purchase` (`selectedEvent` es un evento, no el catálogo).
 * Único valor, sin clave: `GET /events` no acepta parámetros.
 */
let cachedEvents: Event[] | null = null

/**
 * `GET /events` (SpecHttp 7.5) — listado completo, sin paginación.
 * La primera llamada de la sesión pide red; las siguientes devuelven la
 * caché en memoria mientras siga vigente (SpecPurchase 6).
 */
export const getEvents = async (): Promise<Event[]> => {
  if (cachedEvents) {
    return cachedEvents
  }
  const response = await httpClient.get<{ data: unknown }>('/events')
  cachedEvents = EventsResponseSchema.parse(response).data
  return cachedEvents
}

/**
 * Invalida la caché del catálogo (SpecPurchase 6: `LOGOUT`/`SESSION_EXPIRED`
 * de la slice `auth`). `services/` no puede escuchar la slice directamente
 * (regla de dependencia de SpecProject 1) — quien despacha esas
 * transiciones llama a esta función explícitamente.
 */
export const clearEventsCache = (): void => {
  cachedEvents = null
}
