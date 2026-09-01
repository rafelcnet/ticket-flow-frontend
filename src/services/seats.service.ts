import { SeatMapResponseSchema, type SeatMapResponse } from '../schemas/seat-map.schema'
import { httpClient } from '../http/http.client'

/** `GET /events/:id/seats` (SpecHttp 7.6) — mapa de asientos por evento. */
export const getSeatMap = async (eventId: string): Promise<SeatMapResponse> => {
  const response = await httpClient.get<SeatMapResponse>(`/events/${eventId}/seats`)
  return SeatMapResponseSchema.parse(response)
}
