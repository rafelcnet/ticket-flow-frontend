import { createContext, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  bookingsReducer,
  initialBookingsState,
  type BookingsAction,
  type BookingsState,
} from './bookings.reducer'

export interface BookingsContextValue {
  state: BookingsState
  dispatch: Dispatch<BookingsAction>
}

export const BookingsContext = createContext<BookingsContextValue | null>(null)

/**
 * Provider de la slice `bookings` (Context API + useReducer, SpecProject
 * 0/3.6). Se monta localmente en `/bookings` — no necesita sobrevivir fuera
 * de esa ruta.
 */
export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(bookingsReducer, initialBookingsState)
  return <BookingsContext value={{ state, dispatch }}>{children}</BookingsContext>
}
