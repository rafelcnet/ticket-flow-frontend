import { z } from 'zod'

export const BookingStatusSchema = z.enum(['confirmed', 'pending', 'cancelled'])

export type BookingStatus = z.infer<typeof BookingStatusSchema>

/** `payment` dentro de `POST /bookings` (SpecHttp 7.8, 6 — reenvío del `transactionId`). */
export const BookingPaymentSchema = z.object({
  method: z.enum(['card', 'paypal']),
  transactionId: z.string(),
})

/** `POST /bookings` — request body (SpecHttp 7.8). */
export const CreateBookingRequestSchema = z.object({
  eventId: z.string(),
  seatId: z.string(),
  contactEmail: z.email(),
  contactPhone: z.string(),
  payment: BookingPaymentSchema,
  total: z.number().optional(),
})

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>

/**
 * Reserva completa (SpecHttp 7.8 · 201, 7.9 · item de `data[]`).
 * `zone` aquí es el NOMBRE de la zona — distinto de `seat.zone` en
 * `schemas/seat-map.schema` (SpecHttp 7.6/7.8). `cancelledAt` usa el formato
 * SQLite (`YYYY-MM-DD HH:MM:SS`) o `null`, no ISO 8601 — distinto de la
 * respuesta de cancelación (SpecHttp 7.9/7.10).
 */
export const BookingSchema = z.object({
  id: z.string(),
  status: BookingStatusSchema,
  total: z.number(),
  currency: z.literal('USD'),
  contactEmail: z.email(),
  paymentMethod: z.enum(['card', 'paypal']),
  transactionId: z.string(),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
  eventId: z.string(),
  eventName: z.string(),
  eventDate: z.string(),
  eventTime: z.string(),
  location: z.string(),
  seatId: z.string(),
  row: z.number(),
  col: z.number(),
  zone: z.string(),
})

export type Booking = z.infer<typeof BookingSchema>

/** `GET /bookings` — 200 OK (SpecHttp 7.9). */
export const BookingsListResponseSchema = z.object({
  data: z.array(BookingSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export type BookingsListResponse = z.infer<typeof BookingsListResponseSchema>

export interface BookingsListFilters {
  page?: number
  limit?: number
  status?: BookingStatus
  eventName?: string
  dateFrom?: string
  dateTo?: string
}

/**
 * `PATCH /bookings/:id/cancel` — 200 OK (SpecHttp 7.10).
 * `cancelledAt` aquí SÍ es ISO 8601 — no confundir con `BookingSchema.cancelledAt`.
 */
export const CancelBookingResponseSchema = z.object({
  id: z.string(),
  status: z.literal('cancelled'),
  cancelledAt: z.string(),
})

export type CancelBookingResponse = z.infer<typeof CancelBookingResponseSchema>
