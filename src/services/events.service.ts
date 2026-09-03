import {
  PaginatedEventsResponseSchema,
  type PaginatedEventsResponse,
} from '../schemas/events.schema'
import { httpClient } from '../http/http.client'

/**
 * `GET /events/paginated` (FIX-1) — catálogo de eventos paginado, 6 por
 * página. Reemplaza el listado completo + caché en memoria de SpecPurchase
 * 6: cada página es una petición distinta con sus propios `page`/`limit`,
 * así que "cachear todo el catálogo en un único valor" ya no aplica — misma
 * decisión que ya tiene `/bookings` (sin caché, siempre se repite la
 * petición al cambiar de página o al volver a la pantalla).
 */
export const getPaginatedEvents = async (
  page: number,
  limit: number,
): Promise<PaginatedEventsResponse> => {
  const response = await httpClient.get<PaginatedEventsResponse>('/events/paginated', {
    query: { page, limit },
  })
  return PaginatedEventsResponseSchema.parse(response)
}
