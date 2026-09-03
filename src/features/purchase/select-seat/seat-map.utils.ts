import type { Seat, Zone } from '../../../schemas/seat-map.schema'

/** Texto del popover de asiento (Context.md 5.4, SpecSeatMap 3). */
export const describeSeat = (seat: Seat, zone: Zone | undefined): string =>
  zone
    ? `Fila ${seat.row}, Columna ${seat.col} — ${zone.name} ($${zone.price.toFixed(2)})`
    : `Fila ${seat.row}, Columna ${seat.col}`

/** Cruce `seat.zone` (ID) → `Zone` para resolver nombre/precio (SpecSeatMap 3). */
export const zonesById = (zones: Zone[]): Record<string, Zone> =>
  Object.fromEntries(zones.map((zone) => [zone.id, zone]))

/**
 * Agrupa `seats` por fila para los layouts en grilla (Halfmoon, Flat).
 * El backend ya entrega `seats` ordenados por `row` ASC, luego `col` ASC
 * (`SpecHttp` 7.6) — no se reordena aquí, se confía en ese contrato.
 */
export const groupByRow = (seats: Seat[]): [number, Seat[]][] => {
  const byRow = new Map<number, Seat[]>()
  for (const seat of seats) {
    const rowSeats = byRow.get(seat.row) ?? []
    rowSeats.push(seat)
    byRow.set(seat.row, rowSeats)
  }
  return [...byRow.entries()]
}
