import type { Seat, Zone } from '../../../schemas/seat-map.schema'
import { describeSeat } from './seat-map.utils'
import styles from './SeatMap.module.css'

interface SeatButtonProps {
  seat: Seat
  zone: Zone | undefined
  isSelected: boolean
  onSeatClick: (seatId: string) => void
}

/**
 * Botón de asiento compartido por los layouts Halfmoon y Flat (Arena usa
 * SVG, ver `SeatMapArena`). Estados visuales de Context.md 5.4 / SpecSeatMap
 * 2: `occupied` (gris, deshabilitado), `selected` (naranja, clicable —
 * deselecciona). `available` usa el color de su zona (`zone.color`, ver
 * leyenda) en vez de un verde plano, para distinguir VIP/Premium/General a
 * simple vista sobre el propio mapa, no sólo en la leyenda.
 */
export const SeatButton = ({ seat, zone, isSelected, onSeatClick }: SeatButtonProps) => {
  const isOccupied = seat.status === 'occupied'
  const className = [
    styles.seat,
    isOccupied ? styles.seatOccupied : isSelected ? styles.seatSelected : styles.seatAvailable,
  ].join(' ')
  const style = !isOccupied && !isSelected && zone ? { backgroundColor: zone.color } : undefined

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={isOccupied}
      title={isOccupied ? undefined : describeSeat(seat, zone)}
      aria-pressed={isSelected}
      aria-label={`Fila ${seat.row}, columna ${seat.col}${isOccupied ? ' — ocupado' : ''}`}
      onClick={() => onSeatClick(seat.seatId)}
    />
  )
}
