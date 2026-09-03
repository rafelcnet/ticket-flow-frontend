import { describe, expect, it } from 'vitest'
import {
  initialSeatMapState,
  seatMapReducer,
  type SeatMapAction,
  type SeatMapState,
} from './seat-map.reducer'

const zonas = [
  { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 },
  { id: 'zon-002', name: 'General', color: '#4caf50', price: 75 },
]

const asientos = [
  { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'available' as const },
  { seatId: 'sea-002', row: 1, col: 2, zone: 'zon-001', status: 'occupied' as const },
  { seatId: 'sea-003', row: 2, col: 1, zone: 'zon-002', status: 'available' as const },
]

const estadoCargado: SeatMapState = {
  status: 'loaded',
  zones: zonas,
  seats: asientos,
  selectedSeatId: null,
  errorCode: null,
}

describe('seatMapReducer', () => {
  it('el estado inicial arranca en idle, sin datos ni selección (SpecState 4.1)', () => {
    // Given / When: el estado inicial de la slice seatMap
    // Then: no hay zonas, asientos ni selección todavía
    expect(initialSeatMapState).toEqual({
      status: 'idle',
      zones: [],
      seats: [],
      selectedSeatId: null,
      errorCode: null,
    })
  })

  it('LOAD_SEAT_MAP pasa a loading (SpecSeatMap 4.3)', () => {
    // Given: la slice recién entra al Paso 3
    // When: se despacha LOAD_SEAT_MAP
    const result = seatMapReducer(initialSeatMapState, { type: 'LOAD_SEAT_MAP' })

    // Then: pasa a loading, disparando GET /events/:id/seats
    expect(result.status).toBe('loading')
  })

  it('LOAD_SEAT_MAP revalida la slice completa desde cero, aunque ya hubiera datos y selección (SpecState 4.2)', () => {
    // Given: la slice ya está cargada con un asiento seleccionado
    const estadoConSeleccion: SeatMapState = { ...estadoCargado, selectedSeatId: 'sea-001' }

    // When: se vuelve a entrar al Paso 3 (LOAD_SEAT_MAP otra vez)
    const result = seatMapReducer(estadoConSeleccion, { type: 'LOAD_SEAT_MAP' })

    // Then: zonas, asientos y selección se descartan — vuelve a loading desde cero
    expect(result).toEqual({ ...initialSeatMapState, status: 'loading' })
  })

  it('LOAD_SUCCESS guarda zones y seats, y limpia cualquier selección previa', () => {
    // Given: la carga está en curso
    const estadoCargando: SeatMapState = { ...initialSeatMapState, status: 'loading' }

    // When: llega la respuesta 200 de GET /events/:id/seats
    const result = seatMapReducer(estadoCargando, {
      type: 'LOAD_SUCCESS',
      payload: { zones: zonas, seats: asientos },
    })

    // Then: la slice queda loaded, sin selección (sin-seleccion)
    expect(result.status).toBe('loaded')
    expect(result.zones).toEqual(zonas)
    expect(result.seats).toEqual(asientos)
    expect(result.selectedSeatId).toBeNull()
  })

  it('LOAD_ERROR pasa a error y guarda el código de negocio (ej. EVENT_NOT_FOUND, SpecSeatMap 4.4)', () => {
    // Given: la carga está en curso
    const estadoCargando: SeatMapState = { ...initialSeatMapState, status: 'loading' }

    // When: el backend responde 404 EVENT_NOT_FOUND
    const result = seatMapReducer(estadoCargando, {
      type: 'LOAD_ERROR',
      payload: { code: 'EVENT_NOT_FOUND' },
    })

    // Then: la slice queda en error, con el código guardado
    expect(result.status).toBe('error')
    expect(result.errorCode).toBe('EVENT_NOT_FOUND')
  })

  it('RETRY vuelve a loading y limpia el código de error (SpecSeatMap 4.3)', () => {
    // Given: la slice está en error
    const estadoConError: SeatMapState = {
      ...initialSeatMapState,
      status: 'error',
      errorCode: 'EVENT_NOT_FOUND',
    }

    // When: el usuario reintenta
    const result = seatMapReducer(estadoConError, { type: 'RETRY' })

    // Then: vuelve a loading, sin el código de error anterior
    expect(result.status).toBe('loading')
    expect(result.errorCode).toBeNull()
  })

  it('CLICK_SEAT sobre un asiento available lo selecciona (SpecSeatMap 4.3)', () => {
    // Given: la slice está cargada, sin selección
    // When: se hace click en un asiento available
    const result = seatMapReducer(estadoCargado, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-001' },
    })

    // Then: queda seleccionado
    expect(result.selectedSeatId).toBe('sea-001')
  })

  it('CLICK_SEAT sobre el mismo asiento ya seleccionado lo deselecciona', () => {
    // Given: sea-001 ya está seleccionado
    const estadoConSeleccion: SeatMapState = { ...estadoCargado, selectedSeatId: 'sea-001' }

    // When: se vuelve a hacer click sobre el mismo asiento
    const result = seatMapReducer(estadoConSeleccion, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-001' },
    })

    // Then: la selección se limpia
    expect(result.selectedSeatId).toBeNull()
  })

  it('CLICK_SEAT sobre otro asiento available cambia la selección (única, SpecSeatMap 4.3)', () => {
    // Given: sea-001 ya está seleccionado
    const estadoConSeleccion: SeatMapState = { ...estadoCargado, selectedSeatId: 'sea-001' }

    // When: el usuario elige otro asiento disponible
    const result = seatMapReducer(estadoConSeleccion, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-003' },
    })

    // Then: sólo el nuevo asiento queda seleccionado
    expect(result.selectedSeatId).toBe('sea-003')
  })

  it('CLICK_SEAT sobre un asiento occupied es un no-op (Context.md 5.4: occupied no es clicable)', () => {
    // Given: la slice está cargada, sin selección
    // When: se intenta hacer click en un asiento occupied
    const result = seatMapReducer(estadoCargado, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-002' },
    })

    // Then: no pasa nada — misma referencia de estado
    expect(result).toBe(estadoCargado)
  })

  it('CLICK_SEAT sobre un seatId inexistente es un no-op', () => {
    // Given: la slice está cargada
    // When: llega un seatId que no existe en seats[]
    const result = seatMapReducer(estadoCargado, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-999' },
    })

    // Then: no pasa nada
    expect(result).toBe(estadoCargado)
  })

  it('CLICK_SEAT fuera de loaded (ej. todavía loading) es un no-op', () => {
    // Given: la slice sigue cargando
    const estadoCargando: SeatMapState = { ...initialSeatMapState, status: 'loading' }

    // When: llega un CLICK_SEAT de todas formas
    const result = seatMapReducer(estadoCargando, {
      type: 'CLICK_SEAT',
      payload: { seatId: 'sea-001' },
    })

    // Then: no pasa nada
    expect(result).toBe(estadoCargando)
  })

  it('SEAT_CONFLICT_DETECTED limpia la selección y vuelve a loading para revalidar (SpecSeatMap 4.5, TF-7)', () => {
    // Given: un asiento seleccionado que resultó ocupado al crear la reserva (409 SEAT_UNAVAILABLE)
    const estadoConSeleccion: SeatMapState = { ...estadoCargado, selectedSeatId: 'sea-001' }

    // When: llega el conflicto desde el Paso 4 de Payment
    const result = seatMapReducer(estadoConSeleccion, { type: 'SEAT_CONFLICT_DETECTED' })

    // Then: se limpia la selección obsoleta y vuelve a loading (dispara GET /events/:id/seats de nuevo)
    expect(result.selectedSeatId).toBeNull()
    expect(result.status).toBe('loading')
  })

  it('ignora una acción desconocida y devuelve el mismo estado', () => {
    // Given: un estado cualquiera
    const accionDesconocida = { type: 'ACCION_INEXISTENTE' } as unknown as SeatMapAction

    // When: se despacha una acción fuera de la FSM
    const result = seatMapReducer(estadoCargado, accionDesconocida)

    // Then: el estado no cambia
    expect(result).toBe(estadoCargado)
  })
})
