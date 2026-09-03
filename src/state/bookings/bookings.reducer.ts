import type { Booking, BookingStatus } from '../../schemas/booking.schema'

/**
 * Slice `bookings` (Context.md 8.4, SpecBookings 4, SpecState 5).
 * `filters`/`page`/`limit` son un espejo derivado de la URL (SpecBookings 1)
 * — ningún componente los escribe directo, siempre pasan por la URL antes.
 * `status` (FSM de carga) y `pagination` (SpecBookings 3: `total`/`totalPages`
 * "siempre vienen del servidor") se añaden como campos de la slice por el
 * mismo criterio ya usado con `status` en `seatMap` (TF-6): llegan en la
 * misma respuesta que `items`, para la misma pantalla — no son un dato
 * transversal que amerite guardarse fuera de la slice.
 */
export type BookingsLoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface BookingsFilters {
  eventName?: string
  status?: BookingStatus
  dateFrom?: string
  dateTo?: string
}

export interface BookingsPagination {
  total: number
  totalPages: number
}

export interface BookingsState {
  status: BookingsLoadStatus
  filters: BookingsFilters
  page: number
  limit: number
  items: Booking[]
  pagination: BookingsPagination
}

export const initialBookingsState: BookingsState = {
  status: 'idle',
  filters: {},
  page: 1,
  limit: 10,
  items: [],
  pagination: { total: 0, totalPages: 0 },
}

export type BookingsAction =
  | {
      type: 'LOAD_BOOKINGS'
      payload: { filters: BookingsFilters; page: number; limit: number }
    }
  | { type: 'LOAD_SUCCESS'; payload: { items: Booking[]; pagination: BookingsPagination } }
  | { type: 'LOAD_ERROR' }
  | { type: 'CANCEL_SUCCESS'; payload: { id: string; status: 'cancelled'; cancelledAt: string } }

/**
 * FSM de la slice `bookings` (SpecBookings 4.2/4.3, 6.2). `CANCEL_CONFLICT`
 * y `CANCEL_NOT_FOUND` (409/404, SpecBookings 6.3/6.4) no son casos propios
 * de este reducer: la Revalidation que exigen es, literal y textualmente,
 * "el mismo mecanismo de LOAD_BOOKINGS" — el componente vuelve a despachar
 * esa misma acción con los `filters`/`page`/`limit` ya vigentes.
 */
export const bookingsReducer = (
  state: BookingsState,
  action: BookingsAction,
): BookingsState => {
  switch (action.type) {
    case 'LOAD_BOOKINGS':
      return {
        ...state,
        status: 'loading',
        filters: action.payload.filters,
        page: action.payload.page,
        limit: action.payload.limit,
      }
    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'loaded',
        items: action.payload.items,
        pagination: action.payload.pagination,
      }
    case 'LOAD_ERROR':
      return { ...state, status: 'error' }
    case 'CANCEL_SUCCESS':
      // Patch local (SpecBookings 6.2) — sólo id/status/cancelledAt, el
      // resto del booking se conserva tal cual (PATCH .../cancel no lo devuelve).
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, status: action.payload.status, cancelledAt: action.payload.cancelledAt }
            : item,
        ),
      }
    default:
      return state
  }
}
