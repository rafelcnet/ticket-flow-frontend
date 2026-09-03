import { useMemo } from 'react'
import type { SeatMapLayoutProps } from './seat-map-layout.types'
import { describeSeat, zonesById } from './seat-map.utils'
import styles from './SeatMap.module.css'

const VIEWBOX_SIZE = 360
const CENTER = VIEWBOX_SIZE / 2
const SEAT_RADIUS = 9
/** Radio por anillo (fila 1 = anillo interior) — fórmula propia, no fijada por el PRD (sección 1.1). */
const RING_RADIUS = [60, 92, 124, 156]
const SEATS_PER_RING = 12

const seatPosition = (row: number, col: number) => {
  const radius = RING_RADIUS[row - 1] ?? RING_RADIUS[RING_RADIUS.length - 1]
  const angle = ((col - 1) / SEATS_PER_RING) * 2 * Math.PI - Math.PI / 2
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  }
}

/**
 * Layout Arena — asientos en círculos concéntricos, 4 anillos × 12 asientos,
 * renderizado con SVG (Context.md 5.4, explícito en `SpecSeatMap` 1).
 */
export const SeatMapArena = ({ seats, zones, selectedSeatId, onSeatClick }: SeatMapLayoutProps) => {
  const zoneById = useMemo(() => zonesById(zones), [zones])

  return (
    <svg
      className={styles.arenaSvg}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      role="group"
      aria-label="Mapa de asientos — arena"
    >
      <circle cx={CENTER} cy={CENTER} r={36} className={styles.stageCircle} />
      <text x={CENTER} y={CENTER} className={styles.stageLabel}>
        Escenario
      </text>
      {seats.map((seat) => {
        const { x, y } = seatPosition(seat.row, seat.col)
        const isOccupied = seat.status === 'occupied'
        const isSelected = seat.seatId === selectedSeatId
        const zone = zoneById[seat.zone]
        const className = [
          styles.svgSeat,
          isOccupied
            ? styles.svgSeatOccupied
            : isSelected
              ? styles.svgSeatSelected
              : styles.svgSeatAvailable,
        ].join(' ')
        // `available` toma el color de su zona (VIP/Premium/General) en vez de un verde
        // plano, para que la zona se distinga sobre el propio mapa (no sólo en la leyenda).
        const style = !isOccupied && !isSelected && zone ? { fill: zone.color } : undefined

        return (
          <circle
            key={seat.seatId}
            cx={x}
            cy={y}
            r={SEAT_RADIUS}
            className={className}
            style={style}
            role="button"
            tabIndex={isOccupied ? -1 : 0}
            aria-pressed={isSelected}
            aria-disabled={isOccupied}
            aria-label={`Fila ${seat.row}, columna ${seat.col}${isOccupied ? ' — ocupado' : ''}`}
            onClick={() => !isOccupied && onSeatClick(seat.seatId)}
            onKeyDown={(event) => {
              if (!isOccupied && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onSeatClick(seat.seatId)
              }
            }}
          >
            {!isOccupied && <title>{describeSeat(seat, zone)}</title>}
          </circle>
        )
      })}
    </svg>
  )
}
