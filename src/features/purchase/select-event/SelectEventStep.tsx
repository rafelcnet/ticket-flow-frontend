import { useEffect, useState } from 'react'
import { usePurchase } from '../../../hooks/usePurchase'
import type { Event } from '../../../schemas/events.schema'
import { getPaginatedEvents } from '../../../services/events.service'
import { PaginationBar } from '../../../components/tables/PaginationBar'
import styles from './SelectEventStep.module.css'

/** Eventos por página (FIX-1): `GET /events/paginated?page=X&limit=6`. */
const PAGE_SIZE = 6

/** `Desde $XX.XX USD` — etiqueta de precio literal de Context.md 5.4 Paso 1. */
const formatBasePrice = (event: Event) =>
  `Desde $${event.basePrice.toFixed(2)} ${event.currency}`

/**
 * Paso 1 — Seleccionar Evento (Context.md 5.4, SpecPurchase 2.1, FIX-1).
 * El catálogo se pide paginado (6 eventos por página, sin caché — cada
 * página es su propia petición, igual que `/bookings`). El evento elegido
 * se guarda completo al hacer click (no sólo su id) para que la selección
 * sobreviva a un cambio de página, aunque esa página ya no incluya la card
 * — `SELECT_EVENT` (y el avance de paso) sólo se dispara al pulsar Next.
 */
export const SelectEventStep = () => {
  const { state, dispatch } = usePurchase()
  const [page, setPage] = useState(1)
  const [events, setEvents] = useState<Event[] | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [highlightedEvent, setHighlightedEvent] = useState<Event | null>(
    state.selectedEvent,
  )

  useEffect(() => {
    // La página anterior se conserva visible hasta que llega la nueva
    // (sin parpadeo de "Cargando…" entre páginas) — sólo el primer montaje
    // pasa por el estado de carga inicial (`events` arranca en null).
    getPaginatedEvents(page, PAGE_SIZE).then((response) => {
      setEvents(response.data)
      setTotalPages(response.pagination.totalPages)
    })
  }, [page])

  const handleNext = () => {
    if (highlightedEvent) {
      dispatch({ type: 'SELECT_EVENT', payload: { event: highlightedEvent } })
    }
  }

  if (!events) {
    return <p>Cargando eventos…</p>
  }

  if (events.length === 0) {
    return <p className={styles.empty}>No hay eventos disponibles por ahora.</p>
  }

  return (
    <div>
      <div className={styles.grid}>
        {events.map((event) => {
          const isSelected = event.id === highlightedEvent?.id
          return (
            <button
              key={event.id}
              type="button"
              className={
                isSelected ? `${styles.card} ${styles.cardSelected}` : styles.card
              }
              aria-pressed={isSelected}
              onClick={() => setHighlightedEvent(event)}
            >
              <img
                className={styles.image}
                src={event.imageUrl}
                alt={event.name}
                loading="lazy"
              />
              <span className={styles.name}>{event.name}</span>
              <span className={styles.meta}>
                {event.date} · {event.time}
              </span>
              <span className={styles.meta}>{event.location}</span>
              <span className={styles.price}>{formatBasePrice(event)}</span>
            </button>
          )
        })}
      </div>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.next}
          disabled={!highlightedEvent}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  )
}
