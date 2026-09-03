import { useContext } from 'react'
import { SeatMapContext } from '../state/seat-map/seat-map.context'

/** Acceso a la slice `seatMap` (SpecProject 3.2: hook compartido, prefijo `use`). */
export const useSeatMap = () => {
  const context = useContext(SeatMapContext)
  if (!context) {
    throw new Error('useSeatMap debe usarse dentro de un SeatMapProvider')
  }
  return context
}
