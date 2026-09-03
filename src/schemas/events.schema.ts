import { z } from 'zod'

/** `GET /events` — item de `data[]` (SpecHttp 7.5). `venueType` NO vive aquí. */
export const EventSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  name: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  imageUrl: z.string(),
  basePrice: z.number(),
  currency: z.literal('USD'),
})

export type Event = z.infer<typeof EventSchema>

/** `GET /events` — 200 OK (SpecHttp 7.5). */
export const EventsResponseSchema = z.object({
  data: z.array(EventSchema),
})

export type EventsResponse = z.infer<typeof EventsResponseSchema>

/**
 * `GET /events/paginated` — 200 OK (FIX-1: paginación del catálogo, 6
 * eventos por página). Misma forma de `pagination` que `GET /bookings`
 * (`schemas/booking.schema`): `{ page, limit, total, totalPages }`.
 */
export const PaginatedEventsResponseSchema = z.object({
  data: z.array(EventSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export type PaginatedEventsResponse = z.infer<typeof PaginatedEventsResponseSchema>
