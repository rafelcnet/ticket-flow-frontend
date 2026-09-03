import { createContext, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  seatMapReducer,
  initialSeatMapState,
  type SeatMapAction,
  type SeatMapState,
} from './seat-map.reducer'

export interface SeatMapContextValue {
  state: SeatMapState
  dispatch: Dispatch<SeatMapAction>
}

export const SeatMapContext = createContext<SeatMapContextValue | null>(null)

/**
 * Provider de la slice `seatMap` (Context API + useReducer, SpecProject
 * 0/3.6). Se monta junto a `PurchaseProvider` en `/buy` — la necesita el
 * Paso 3 y, más adelante, la revalidación desde el Paso 4 (SpecPurchase 2.2).
 */
export const SeatMapProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(seatMapReducer, initialSeatMapState)
  return <SeatMapContext value={{ state, dispatch }}>{children}</SeatMapContext>
}
