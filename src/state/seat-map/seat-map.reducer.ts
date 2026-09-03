import type { Zone, Seat } from '../../schemas/seat-map.schema'

/**
 * Slice `seatMap` (Context.md 8.4, SpecState 4, SpecSeatMap 4) — combina la
 * capa de carga de datos (`idle` → `loading` → `loaded` | `error`) con la
 * selección local anidada dentro de `loaded` (`selectedSeatId`).
 * `SEAT_CONFLICT_DETECTED` (SpecSeatMap 4.5, TF-7) llega desde el Paso 4 de
 * Payment tras un 409 `SEAT_UNAVAILABLE` en `POST /bookings` — reutiliza el
 * estado `loading` (no un `seat-conflict` separado) para que el mismo efecto
 * de `SelectSeatStep` que ya revalida en `LOAD_SEAT_MAP`/`RETRY` dispare de
 * nuevo `GET /events/:id/seats` sin duplicar esa lógica.
 */
export type SeatMapStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface SeatMapState {
  status: SeatMapStatus
  zones: Zone[]
  seats: Seat[]
  selectedSeatId: string | null
  errorCode: string | null
}

export const initialSeatMapState: SeatMapState = {
  status: 'idle',
  zones: [],
  seats: [],
  selectedSeatId: null,
  errorCode: null,
}

export type SeatMapAction =
  | { type: 'LOAD_SEAT_MAP' }
  | { type: 'LOAD_SUCCESS'; payload: { zones: Zone[]; seats: Seat[] } }
  | { type: 'LOAD_ERROR'; payload: { code: string } }
  | { type: 'CLICK_SEAT'; payload: { seatId: string } }
  | { type: 'RETRY' }
  | { type: 'SEAT_CONFLICT_DETECTED' }

export const seatMapReducer = (
  state: SeatMapState,
  action: SeatMapAction,
): SeatMapState => {
  switch (action.type) {
    case 'LOAD_SEAT_MAP':
      // "Esta acción siempre revalida la slice completa desde cero" (SpecState 4.2).
      return { ...initialSeatMapState, status: 'loading' }
    case 'RETRY':
      return { ...state, status: 'loading', errorCode: null }
    case 'SEAT_CONFLICT_DETECTED':
      // SpecSeatMap 4.5: limpia la selección obsoleta y dispara la revalidación.
      return { ...state, status: 'loading', selectedSeatId: null }
    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'loaded',
        zones: action.payload.zones,
        seats: action.payload.seats,
        selectedSeatId: null,
      }
    case 'LOAD_ERROR':
      return { ...state, status: 'error', errorCode: action.payload.code }
    case 'CLICK_SEAT': {
      if (state.status !== 'loaded') {
        return state
      }
      const seat = state.seats.find(
        (candidate) => candidate.seatId === action.payload.seatId,
      )
      // Un seat `occupied` no dispara transición — no-op por guarda fallida (SpecSeatMap 4.3).
      if (!seat || seat.status !== 'available') {
        return state
      }
      return {
        ...state,
        selectedSeatId: state.selectedSeatId === seat.seatId ? null : seat.seatId,
      }
    }
    default:
      return state
  }
}
