import { useMemo } from 'react'
import type { SeatMapLayoutProps } from './seat-map-layout.types'
import { groupByRow, zonesById } from './seat-map.utils'
import { SeatButton } from './SeatButton'
import styles from './SeatMap.module.css'

/** Layout Flat — grilla rectangular simple, 8 filas × 10 asientos (Context.md 5.4). */
export const SeatMapFlat = ({ seats, zones, selectedSeatId, onSeatClick }: SeatMapLayoutProps) => {
  const zoneById = useMemo(() => zonesById(zones), [zones])
  const rows = useMemo(() => groupByRow(seats), [seats])

  return (
    <div className={styles.flat}>
      <p className={styles.stageLabelText}>Escenario</p>
      {rows.map(([row, rowSeats]) => (
        <div key={row} className={styles.flatRow}>
          {rowSeats.map((seat) => (
            <SeatButton
              key={seat.seatId}
              seat={seat}
              zone={zoneById[seat.zone]}
              isSelected={seat.seatId === selectedSeatId}
              onSeatClick={onSeatClick}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
