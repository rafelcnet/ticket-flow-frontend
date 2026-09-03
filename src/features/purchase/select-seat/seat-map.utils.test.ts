import { describe, expect, it } from 'vitest'
import { describeSeat, groupByRow, zonesById } from './seat-map.utils'

const zonaVip = { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 }
const zonaGeneral = { id: 'zon-002', name: 'General', color: '#4caf50', price: 75 }

describe('describeSeat', () => {
  it('describe fila, columna, nombre y precio de la zona resuelta (Context.md 5.4, SpecSeatMap 3)', () => {
    // Given: un asiento con su zona ya resuelta
    const asiento = { seatId: 'sea-001', row: 2, col: 5, zone: 'zon-001', status: 'available' as const }

    // When: se describe para el popover
    const descripcion = describeSeat(asiento, zonaVip)

    // Then: incluye fila, columna, nombre de zona y precio formateado
    expect(descripcion).toBe('Fila 2, Columna 5 — VIP ($150.00)')
  })

  it('describe sólo fila y columna si la zona no se pudo resolver', () => {
    // Given: un asiento cuya zona no está en zones[] (dato inconsistente)
    const asiento = { seatId: 'sea-001', row: 2, col: 5, zone: 'zon-999', status: 'available' as const }

    // When: se describe sin poder resolver la zona
    const descripcion = describeSeat(asiento, undefined)

    // Then: no inventa un nombre/precio de zona
    expect(descripcion).toBe('Fila 2, Columna 5')
  })
})

describe('zonesById', () => {
  it('indexa las zonas por su id (seat.zone es el ID, no el nombre — SpecHttp 7.6)', () => {
    // Given: la lista de zonas de GET /events/:id/seats
    // When: se indexan por id
    const indice = zonesById([zonaVip, zonaGeneral])

    // Then: cada zona es accesible por su id
    expect(indice['zon-001']).toEqual(zonaVip)
    expect(indice['zon-002']).toEqual(zonaGeneral)
  })

  it('devuelve un índice vacío si no hay zonas', () => {
    // Given / When: una lista de zonas vacía
    const indice = zonesById([])

    // Then: el índice no tiene entradas
    expect(Object.keys(indice)).toHaveLength(0)
  })
})

describe('groupByRow', () => {
  it('agrupa los asientos por fila, confiando en el orden ya dado por el backend (SpecHttp 7.6)', () => {
    // Given: asientos ya ordenados por row ASC, luego col ASC
    const asientos = [
      { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'available' as const },
      { seatId: 'sea-002', row: 1, col: 2, zone: 'zon-001', status: 'occupied' as const },
      { seatId: 'sea-003', row: 2, col: 1, zone: 'zon-002', status: 'available' as const },
    ]

    // When: se agrupan por fila
    const filas = groupByRow(asientos)

    // Then: dos filas, cada una con sus asientos en el orden recibido
    expect(filas).toEqual([
      [1, [asientos[0], asientos[1]]],
      [2, [asientos[2]]],
    ])
  })

  it('devuelve una lista vacía si no hay asientos', () => {
    // Given / When: una lista de asientos vacía
    const filas = groupByRow([])

    // Then: no hay filas
    expect(filas).toEqual([])
  })
})
