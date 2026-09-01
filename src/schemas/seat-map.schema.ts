import { z } from 'zod'

/** `GET /events/:id/seats` — venue layouts soportados (SpecHttp 7.6). */
export const VenueTypeSchema = z.enum(['arena', 'halfmoon', 'flat'])

export type VenueType = z.infer<typeof VenueTypeSchema>

export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  price: z.number(),
})

export type Zone = z.infer<typeof ZoneSchema>

/**
 * `seat.zone` aquí es el ID de zona (referencia a `zones[].id`), no el
 * nombre — distinto de `booking.zone` (`schemas/booking.schema`, SpecHttp 7.6).
 */
export const SeatSchema = z.object({
  seatId: z.string(),
  row: z.number(),
  col: z.number(),
  zone: z.string(),
  status: z.enum(['available', 'occupied']),
})

export type Seat = z.infer<typeof SeatSchema>

/** `GET /events/:id/seats` — 200 OK (SpecHttp 7.6). */
export const SeatMapResponseSchema = z.object({
  eventId: z.string(),
  venueType: VenueTypeSchema,
  zones: z.array(ZoneSchema),
  seats: z.array(SeatSchema),
})

export type SeatMapResponse = z.infer<typeof SeatMapResponseSchema>
