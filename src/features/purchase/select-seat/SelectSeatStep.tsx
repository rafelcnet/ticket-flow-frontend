import { useEffect, useMemo, useState } from 'react'
import { usePurchase } from '../../../hooks/usePurchase'
import { useSeatMap } from '../../../hooks/useSeatMap'
import { getSeatMap } from '../../../services/seats.service'
import { ApiError } from '../../../http/http.types'
import type { VenueType } from '../../../schemas/seat-map.schema'
import type { SeatMapLayoutProps } from './seat-map-layout.types'
import { SeatMapArena } from './SeatMapArena'
import { SeatMapHalfmoon } from './SeatMapHalfmoon'
import { SeatMapFlat } from './SeatMapFlat'
import { ZoneLegend } from './ZoneLegend'
import styles from './SelectSeatStep.module.css'

const LAYOUTS: Record<VenueType, (props: SeatMapLayoutProps) => React.JSX.Element> = {
  arena: SeatMapArena,
  halfmoon: SeatMapHalfmoon,
  flat: SeatMapFlat,
}

/**
 * Paso 3 — Seleccionar tu Asiento (Context.md 5.4, SpecSeatMap 1/4).
 * Al montar dispara `LOAD_SEAT_MAP` (→ `GET /events/:id/seats`), resuelve el
 * layout de venue por convención (`SpecProject` 3.3) según `venueType` de la
 * respuesta (no vive en la slice `seatMap`, sólo `zones`/`seats`/
 * `selectedSeatId`, Context.md 8.4) y sólo avanza (`SELECT_SEAT`) con un
 * asiento `available` ya elegido, resolviendo su zona (SpecPurchase 4.2/4.3).
 */
export const SelectSeatStep = () => {
  const { state: purchaseState, dispatch: purchaseDispatch } = usePurchase()
  const { state: seatMapState, dispatch: seatMapDispatch } = useSeatMap()
  const [venueType, setVenueType] = useState<VenueType | null>(null)

  const eventId = purchaseState.selectedEvent?.id ?? null

  useEffect(() => {
    if (seatMapState.status === 'idle' && eventId) {
      seatMapDispatch({ type: 'LOAD_SEAT_MAP' })
    }
  }, [seatMapState.status, eventId, seatMapDispatch])

  useEffect(() => {
    if (seatMapState.status !== 'loading' || !eventId) {
      return
    }
    let cancelled = false

    getSeatMap(eventId)
      .then((response) => {
        if (cancelled) return
        setVenueType(response.venueType)
        seatMapDispatch({
          type: 'LOAD_SUCCESS',
          payload: { zones: response.zones, seats: response.seats },
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const code = error instanceof ApiError ? error.code : 'UNKNOWN'
        seatMapDispatch({ type: 'LOAD_ERROR', payload: { code } })
      })

    return () => {
      cancelled = true
    }
  }, [seatMapState.status, eventId, seatMapDispatch])

  const selectedSeat = useMemo(
    () => seatMapState.seats.find((seat) => seat.seatId === seatMapState.selectedSeatId) ?? null,
    [seatMapState.seats, seatMapState.selectedSeatId],
  )

  const handleNext = () => {
    if (!selectedSeat) return
    const zone = seatMapState.zones.find((candidate) => candidate.id === selectedSeat.zone)
    if (!zone) return

    purchaseDispatch({
      type: 'SELECT_SEAT',
      payload: {
        seat: {
          seatId: selectedSeat.seatId,
          row: selectedSeat.row,
          col: selectedSeat.col,
          zoneName: zone.name,
          zonePrice: zone.price,
        },
      },
    })
  }

  if (seatMapState.status === 'idle' || seatMapState.status === 'loading') {
    return <p>Cargando mapa de asientos…</p>
  }

  if (seatMapState.status === 'error') {
    return (
      <div className={styles.error}>
        <p>No pudimos cargar el mapa de asientos.</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => seatMapDispatch({ type: 'RETRY' })}
        >
          Reintentar
        </button>
      </div>
    )
  }

  const Layout = venueType ? LAYOUTS[venueType] : null

  return (
    <div>
      {Layout && (
        <Layout
          seats={seatMapState.seats}
          zones={seatMapState.zones}
          selectedSeatId={seatMapState.selectedSeatId}
          onSeatClick={(seatId) => seatMapDispatch({ type: 'CLICK_SEAT', payload: { seatId } })}
        />
      )}
      <ZoneLegend zones={seatMapState.zones} />
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.back}
          onClick={() => purchaseDispatch({ type: 'GO_BACK' })}
        >
          Back
        </button>
        <button
          type="button"
          className={styles.next}
          disabled={!selectedSeat}
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  )
}
