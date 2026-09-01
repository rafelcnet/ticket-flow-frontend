import {
  BookingSchema,
  BookingsListResponseSchema,
  CancelBookingResponseSchema,
  type Booking,
  type BookingsListFilters,
  type BookingsListResponse,
  type CancelBookingResponse,
  type CreateBookingRequest,
} from '../schemas/booking.schema'
import { httpClient } from '../http/http.client'

/**
 * `POST /bookings` (SpecHttp 7.8).
 * Propaga `SEAT_UNAVAILABLE` (409) sin transformar — lo interpreta el paso
 * de Payment del flujo de compra (SpecHttp 5.1).
 */
export const createBooking = async (payload: CreateBookingRequest): Promise<Booking> => {
  const response = await httpClient.post<Booking>('/bookings', payload)
  return BookingSchema.parse(response)
}

/** `GET /bookings` (SpecHttp 7.9) — filtros y paginación server-side. */
export const listBookings = async (
  filters: BookingsListFilters = {},
): Promise<BookingsListResponse> => {
  const response = await httpClient.get<BookingsListResponse>('/bookings', {
    query: { ...filters },
  })
  return BookingsListResponseSchema.parse(response)
}

/**
 * `PATCH /bookings/:id/cancel` (SpecHttp 7.10).
 * Propaga `BOOKING_NOT_FOUND` (404) e `INVALID_TRANSITION` (409) sin
 * transformar — la cancelación no es idempotente (SpecHttp 7.10).
 */
export const cancelBooking = async (
  bookingId: string,
): Promise<CancelBookingResponse> => {
  const response = await httpClient.patch<CancelBookingResponse>(
    `/bookings/${bookingId}/cancel`,
  )
  return CancelBookingResponseSchema.parse(response)
}
