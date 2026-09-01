import { EventsResponseSchema, type Event } from '../schemas/events.schema'
import { httpClient } from '../http/http.client'

/** `GET /events` (SpecHttp 7.5) — listado completo, sin paginación. */
export const getEvents = async (): Promise<Event[]> => {
  const response = await httpClient.get<{ data: unknown }>('/events')
  return EventsResponseSchema.parse(response).data
}
