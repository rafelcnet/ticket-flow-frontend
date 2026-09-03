import { useEffect, useState } from 'react'
import { usePurchase } from '../../../hooks/usePurchase'
import type { Event } from '../../../schemas/events.schema'
import { getEvents } from '../../../services/events.service'
import styles from './SelectEventStep.module.css'

/** `Desde $XX.XX USD` — etiqueta de precio literal de Context.md 5.4 Paso 1. */
const formatBasePrice = (event: Event) =>
  `Desde $${event.basePrice.toFixed(2)} ${event.currency}`

/**
 * Paso 1 — Seleccionar Evento (Context.md 5.4, SpecPurchase 2.1).
 * Al montar pide `GET /events` (con caché, SpecPurchase 6). El click en una
 * card sólo resalta la selección local — `SELECT_EVENT` (y el avance de
 * paso) sólo se dispara al pulsar Next, tal como exige la guarda de la FSM.
 */
export const SelectEventStep = () => {
  const { state, dispatch } = usePurchase()
  const [events, setEvents] = useState<Event[] | null>(null)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(
    state.selectedEvent?.id ?? null,
  )

  useEffect(() => {
    getEvents().then(setEvents)
  }, [])

  const handleNext = () => {
    const event = events?.find((candidate) => candidate.id === highlightedEventId)
    if (event) {
      dispatch({ type: 'SELECT_EVENT', payload: { event } })
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
          const isSelected = event.id === highlightedEventId
          return (
            <button
              key={event.id}
              type="button"
              className={
                isSelected ? `${styles.card} ${styles.cardSelected}` : styles.card
              }
              aria-pressed={isSelected}
              onClick={() => setHighlightedEventId(event.id)}
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
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.next}
          disabled={!highlightedEventId}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  )
}
