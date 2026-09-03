import { useEffect, useState } from 'react'
import type { BookingStatus } from '../../schemas/booking.schema'
import type { BookingsFilters } from '../../state/bookings/bookings.reducer'
import styles from './BookingsFilterBar.module.css'

/** Pausa antes de reflejar `eventName` en la URL — valor de implementación, no fijado por el PRD (SpecBookings 2). */
const EVENT_NAME_DEBOUNCE_MS = 400

interface BookingsFilterBarProps {
  filters: BookingsFilters
  onChange: (patch: Partial<BookingsFilters>) => void
}

/**
 * Barra de filtros (Context.md 5.5, SpecBookings 1/2): búsqueda por evento,
 * status, rango de fechas. Sólo `onChange` conoce la URL (SpecBookings 1:
 * única dirección de escritura) — este componente nunca la toca directo.
 * `eventName` es debounced (texto libre); el resto actualiza de inmediato
 * (SpecBookings 2: selecciones discretas, sin ráfaga de eventos que absorber).
 */
export const BookingsFilterBar = ({ filters, onChange }: BookingsFilterBarProps) => {
  const [eventNameDraft, setEventNameDraft] = useState(filters.eventName ?? '')

  // La URL pudo cambiar por fuera (ej. botón "atrás" del navegador) — se relee (SpecBookings 1).
  useEffect(() => {
    setEventNameDraft(filters.eventName ?? '')
  }, [filters.eventName])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (eventNameDraft !== (filters.eventName ?? '')) {
        onChange({ eventName: eventNameDraft || undefined })
      }
    }, EVENT_NAME_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
    // Sólo `eventNameDraft` dispara el debounce — `filters.eventName`/`onChange`
    // sólo se leen para comparar en el momento en que el timer se cumple.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventNameDraft])

  return (
    <div className={styles.bar}>
      <input
        type="text"
        placeholder="Buscar por evento"
        aria-label="Buscar por evento"
        value={eventNameDraft}
        onChange={(event) => setEventNameDraft(event.target.value)}
      />
      <select
        aria-label="Status"
        value={filters.status ?? ''}
        onChange={(event) =>
          onChange({ status: (event.target.value || undefined) as BookingStatus | undefined })
        }
      >
        <option value="">Todos los estados</option>
        <option value="confirmed">Confirmed</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input
        type="date"
        aria-label="Date from"
        value={filters.dateFrom ?? ''}
        onChange={(event) => onChange({ dateFrom: event.target.value || undefined })}
      />
      <input
        type="date"
        aria-label="Date to"
        value={filters.dateTo ?? ''}
        onChange={(event) => onChange({ dateTo: event.target.value || undefined })}
      />
    </div>
  )
}
