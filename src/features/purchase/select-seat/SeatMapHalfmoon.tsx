import { useMemo } from 'react'
import type { SeatMapLayoutProps } from './seat-map-layout.types'
import { groupByRow, zonesById } from './seat-map.utils'
import { SeatButton } from './SeatButton'
import styles from './SeatMap.module.css'

/** Indentación en px por fila para simular la curva de un teatro (sección 1.1: sin fórmula fijada por el PRD). */
const ROW_INDENT_STEP_PX = 12

/** Layout Halfmoon — filas con indentación progresiva, 6 filas × 10 asientos (Context.md 5.4). */
export const SeatMapHalfmoon = ({
  seats,
  zones,
  selectedSeatId,
  onSeatClick,
}: SeatMapLayoutProps) => {
  const zoneById = useMemo(() => zonesById(zones), [zones])
  const rows = useMemo(() => groupByRow(seats), [seats])
  const rowCount = rows.length

  return (
    <div className={styles.halfmoon}>
      <p className={styles.stageLabelText}>Escenario</p>
      {rows.map(([row, rowSeats], index) => (
        <div
          key={row}
          className={styles.halfmoonRow}
          style={{ marginLeft: `${(rowCount - index) * ROW_INDENT_STEP_PX}px` }}
        >
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
