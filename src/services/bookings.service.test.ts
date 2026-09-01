import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { cancelBooking, createBooking, listBookings } from './bookings.service'

vi.mock('../http/http.client')

const bookingEjemplo = {
  id: 'TF-583921',
  status: 'confirmed',
  total: 150,
  currency: 'USD',
  contactEmail: 'sofia.hernandez@ticketflow.com',
  paymentMethod: 'card',
  transactionId: 'txn-583921',
  createdAt: '2026-07-04 15:31:00',
  cancelledAt: null,
  eventId: 'evt-001',
  eventName: 'Bad Liebre',
  eventDate: '2025-02-15',
  eventTime: '21:00',
  location: 'Ciudad de México, México',
  seatId: 'sea-002',
  row: 1,
  col: 2,
  zone: 'VIP',
}

describe('bookings.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('createBooking', () => {
    it('crea la reserva y devuelve el booking confirmado (201)', async () => {
      // Given: el backend confirma la reserva (SpecHttp 7.8)
      vi.mocked(httpClient.post).mockResolvedValue(bookingEjemplo)
      const payload = {
        eventId: 'evt-001',
        seatId: 'sea-002',
        contactEmail: 'sofia.hernandez@ticketflow.com',
        contactPhone: '+525511223344',
        payment: { method: 'card' as const, transactionId: 'txn-583921' },
        total: 150,
      }

      // When: se crea la reserva reenviando el transactionId del pago aprobado (SpecHttp 6)
      const booking = await createBooking(payload)

      // Then: se llama a POST /bookings con el payload y se devuelve la reserva
      expect(httpClient.post).toHaveBeenCalledWith('/bookings', payload)
      expect(booking.id).toBe('TF-583921')
      expect(booking.zone).toBe('VIP')
    })

    it('propaga SEAT_UNAVAILABLE cuando el asiento ya fue tomado (409)', async () => {
      // Given: el asiento se ocupó entre la selección y el intento de reserva (SpecHttp 7.8)
      const error = Object.assign(new Error('The selected seat is not available'), {
        code: 'SEAT_UNAVAILABLE',
        status: 409,
      })
      vi.mocked(httpClient.post).mockRejectedValue(error)

      // When: se intenta crear la reserva
      const call = createBooking({
        eventId: 'evt-001',
        seatId: 'sea-002',
        contactEmail: 'sofia.hernandez@ticketflow.com',
        contactPhone: '+525511223344',
        payment: { method: 'card', transactionId: 'txn-583921' },
      })

      // Then: el error llega tal cual al paso de Payment del flujo de compra
      await expect(call).rejects.toBe(error)
    })
  })

  describe('listBookings', () => {
    it('lista las reservas del usuario sin filtros (200)', async () => {
      // Given: el backend responde con la primera página por defecto (SpecHttp 7.9)
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [bookingEjemplo],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      })

      // When: se listan las reservas sin pasar ningún filtro
      const result = await listBookings()

      // Then: se llama a GET /bookings sin query params forzados
      expect(httpClient.get).toHaveBeenCalledWith('/bookings', { query: {} })
      expect(result.data).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })

    it('reenvía los filtros de status, eventName y rango de fechas como query params', async () => {
      // Given: el backend soporta filtrar por estos criterios (SpecHttp 7.9)
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
      })

      // When: se listan reservas confirmadas de un evento, paginadas
      await listBookings({
        page: 2,
        limit: 5,
        status: 'confirmed',
        eventName: 'Bad Liebre',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      })

      // Then: todos los filtros llegan como query params
      expect(httpClient.get).toHaveBeenCalledWith('/bookings', {
        query: {
          page: 2,
          limit: 5,
          status: 'confirmed',
          eventName: 'Bad Liebre',
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
        },
      })
    })

    it('devuelve una lista vacía cuando el usuario no tiene reservas', () => {
      // Given: el backend responde sin resultados (SpecHttp 7.9)
      vi.mocked(httpClient.get).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      })

      // When: se listan las reservas
      // Then: no se lanza ningún error al procesar una lista vacía
      return expect(listBookings()).resolves.toMatchObject({ data: [] })
    })
  })

  describe('cancelBooking', () => {
    it('cancela la reserva indicada y devuelve la fecha de cancelación (200)', async () => {
      // Given: la reserva existe y puede cancelarse (SpecHttp 7.10)
      vi.mocked(httpClient.patch).mockResolvedValue({
        id: 'TF-001',
        status: 'cancelled',
        cancelledAt: '2026-07-04T16:00:00.000Z',
      })

      // When: se cancela la reserva TF-001
      const result = await cancelBooking('TF-001')

      // Then: se llama a PATCH /bookings/:id/cancel con el id correcto
      expect(httpClient.patch).toHaveBeenCalledWith('/bookings/TF-001/cancel')
      expect(result.status).toBe('cancelled')
    })

    it('propaga BOOKING_NOT_FOUND cuando la reserva no existe (404)', async () => {
      // Given: el id de reserva no corresponde a ninguna reserva real (SpecHttp 7.10)
      const error = Object.assign(new Error('Booking not found'), {
        code: 'BOOKING_NOT_FOUND',
        status: 404,
      })
      vi.mocked(httpClient.patch).mockRejectedValue(error)

      // When: se intenta cancelar esa reserva
      const call = cancelBooking('TF-999')

      // Then: el error llega tal cual a la feature de Bookings
      await expect(call).rejects.toBe(error)
    })

    it('propaga INVALID_TRANSITION al cancelar una reserva ya cancelada (409)', async () => {
      // Given: la cancelación no es idempotente (SpecHttp 7.10)
      const error = Object.assign(
        new Error('This booking cannot be cancelled in its current state'),
        { code: 'INVALID_TRANSITION', status: 409 },
      )
      vi.mocked(httpClient.patch).mockRejectedValue(error)

      // When: se intenta cancelar una reserva que ya estaba cancelada
      const call = cancelBooking('TF-001')

      // Then: el error llega tal cual, sin convertirse en un 200 repetido
      await expect(call).rejects.toBe(error)
    })
  })
})
