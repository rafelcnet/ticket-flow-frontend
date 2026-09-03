import type { Zone, Seat } from '../../schemas/seat-map.schema'

/**
 * Slice `seatMap` (Context.md 8.4, SpecState 4, SpecSeatMap 4) — combina la
 * capa de carga de datos (`idle` → `loading` → `loaded` | `error`) con la
 * selección local anidada dentro de `loaded` (`selectedSeatId`).
 * `SEAT_CONFLICT_DETECTED` (SpecSeatMap 4.5) llega desde el Paso 4 de Payment
 * — fuera de alcance de TF-6, se añade cuando ese ticket exista.
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

/** FSM de la slice `seatMap` (SpecSeatMap 4.3). */
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
      const seat = state.seats.find((candidate) => candidate.seatId === action.payload.seatId)
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
