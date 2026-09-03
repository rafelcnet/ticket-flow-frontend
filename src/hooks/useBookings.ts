import { useContext } from 'react'
import { BookingsContext } from '../state/bookings/bookings.context'

/** Acceso a la slice `bookings` (SpecProject 3.2: hook compartido, prefijo `use`). */
export const useBookings = () => {
  const context = useContext(BookingsContext)
  if (!context) {
    throw new Error('useBookings debe usarse dentro de un BookingsProvider')
  }
  return context
}
