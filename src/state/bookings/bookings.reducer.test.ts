import { describe, expect, it } from 'vitest'
import {
  bookingsReducer,
  initialBookingsState,
  type BookingsAction,
  type BookingsState,
} from './bookings.reducer'

const bookingConfirmado = {
  id: 'TF-001',
  status: 'confirmed' as const,
  total: 150,
  currency: 'USD' as const,
  contactEmail: 'sofia.hernandez@ticketflow.com',
  paymentMethod: 'card' as const,
  transactionId: 'txn-483920',
  createdAt: '2026-07-04 08:30:00',
  cancelledAt: null,
  eventId: 'evt-001',
  eventName: 'Bad Liebre',
  eventDate: '2025-02-15',
  eventTime: '21:00',
  location: 'Ciudad de México, México',
  seatId: 'sea-001',
  row: 1,
  col: 1,
  zone: 'VIP',
}

const bookingPendiente = {
  ...bookingConfirmado,
  id: 'TF-002',
  status: 'pending' as const,
}

const estadoCargado: BookingsState = {
  status: 'loaded',
  filters: {},
  page: 1,
  limit: 10,
  items: [bookingConfirmado, bookingPendiente],
  pagination: { total: 2, totalPages: 1 },
}

describe('bookingsReducer', () => {
  it('el estado inicial arranca en idle, sin filtros ni reservas (SpecBookings 4.1)', () => {
    // Given / When: el estado inicial de la slice bookings
    // Then: página 1, límite 10 por defecto, sin datos todavía
    expect(initialBookingsState).toEqual({
      status: 'idle',
      filters: {},
      page: 1,
      limit: 10,
      items: [],
      pagination: { total: 0, totalPages: 0 },
    })
  })

  it('LOAD_BOOKINGS guarda filters/page/limit leídos de la URL y pasa a loading (SpecBookings 1/4.2)', () => {
    // Given: la slice recién entra a /bookings
    // When: se despacha LOAD_BOOKINGS con los parámetros de la URL
    const result = bookingsReducer(initialBookingsState, {
      type: 'LOAD_BOOKINGS',
      payload: { filters: { status: 'confirmed' }, page: 2, limit: 25 },
    })

    // Then: la slice refleja exactamente lo que traía la URL, y pasa a loading
    expect(result.status).toBe('loading')
    expect(result.filters).toEqual({ status: 'confirmed' })
    expect(result.page).toBe(2)
    expect(result.limit).toBe(25)
  })

  it('LOAD_SUCCESS guarda items y pagination, siempre tal como los devuelve el servidor (SpecBookings 3)', () => {
    // Given: la carga está en curso
    const estadoCargando: BookingsState = { ...initialBookingsState, status: 'loading' }

    // When: llega la respuesta 200 de GET /bookings
    const result = bookingsReducer(estadoCargando, {
      type: 'LOAD_SUCCESS',
      payload: { items: [bookingConfirmado], pagination: { total: 1, totalPages: 1 } },
    })

    // Then: la slice queda loaded, con los datos ya resueltos por el servidor
    expect(result.status).toBe('loaded')
    expect(result.items).toEqual([bookingConfirmado])
    expect(result.pagination).toEqual({ total: 1, totalPages: 1 })
  })

  it('LOAD_ERROR pasa a error (SpecBookings 4.2: sin código de negocio propio en este endpoint)', () => {
    // Given: la carga está en curso
    const estadoCargando: BookingsState = { ...initialBookingsState, status: 'loading' }

    // When: la petición falla
    const result = bookingsReducer(estadoCargando, { type: 'LOAD_ERROR' })

    // Then: la slice queda en error
    expect(result.status).toBe('error')
  })

  it('CANCEL_SUCCESS parchea sólo status y cancelledAt del item afectado, sin tocar el resto (SpecBookings 6.2)', () => {
    // Given: dos reservas cargadas
    // When: se cancela la primera (200 de PATCH /bookings/:id/cancel)
    const result = bookingsReducer(estadoCargado, {
      type: 'CANCEL_SUCCESS',
      payload: { id: 'TF-001', status: 'cancelled', cancelledAt: '2026-07-04T16:00:00.000Z' },
    })

    // Then: sólo ese item cambia, conservando el resto de sus campos
    expect(result.items[0]).toEqual({
      ...bookingConfirmado,
      status: 'cancelled',
      cancelledAt: '2026-07-04T16:00:00.000Z',
    })
    // Y la otra reserva no se ve afectada
    expect(result.items[1]).toEqual(bookingPendiente)
  })

  it('CANCEL_SUCCESS no afecta la paginación — no es un refetch (SpecBookings 6.1: sólo patch local)', () => {
    // Given: la slice cargada con su paginación
    // When: se cancela una reserva
    const result = bookingsReducer(estadoCargado, {
      type: 'CANCEL_SUCCESS',
      payload: { id: 'TF-001', status: 'cancelled', cancelledAt: '2026-07-04T16:00:00.000Z' },
    })

    // Then: pagination se conserva igual
    expect(result.pagination).toEqual(estadoCargado.pagination)
  })

  it('ignora una acción desconocida y devuelve el mismo estado', () => {
    // Given: un estado cualquiera
    const accionDesconocida = { type: 'ACCION_INEXISTENTE' } as unknown as BookingsAction

    // When: se despacha una acción fuera de la FSM
    const result = bookingsReducer(estadoCargado, accionDesconocida)

    // Then: el estado no cambia
    expect(result).toBe(estadoCargado)
  })
})
