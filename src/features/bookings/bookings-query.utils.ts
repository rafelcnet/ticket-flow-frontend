import type { BookingStatus } from '../../schemas/booking.schema'
import type { BookingsFilters } from '../../state/bookings/bookings.reducer'
import { APP_CONFIG } from '../../config/app.config'

const STATUS_VALUES: readonly BookingStatus[] = ['confirmed', 'pending', 'cancelled']

const isBookingStatus = (value: string | null): value is BookingStatus =>
  STATUS_VALUES.includes(value as BookingStatus)

/**
 * La URL es la fuente de verdad de `filters`/`page`/`limit` (SpecBookings 1)
 * — estas funciones son la única forma de leerla e interpretarla, para que
 * ningún componente reinvente su propio parseo.
 */
export const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): BookingsFilters => {
  const status = searchParams.get('status')
  return {
    eventName: searchParams.get('eventName') ?? undefined,
    status: isBookingStatus(status) ? status : undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  }
}

export const parsePageFromSearchParams = (searchParams: URLSearchParams): number => {
  const page = Number(searchParams.get('page'))
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const parseLimitFromSearchParams = (searchParams: URLSearchParams): number => {
  const limit = Number(searchParams.get('limit'))
  return Number.isInteger(limit) && limit > 0 ? limit : APP_CONFIG.defaultPageSize
}
