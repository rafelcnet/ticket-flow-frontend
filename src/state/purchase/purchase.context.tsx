import { createContext, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  purchaseReducer,
  initialPurchaseState,
  type PurchaseAction,
  type PurchaseState,
} from './purchase.reducer'

export interface PurchaseContextValue {
  state: PurchaseState
  dispatch: Dispatch<PurchaseAction>
}

export const PurchaseContext = createContext<PurchaseContextValue | null>(null)

/**
 * Provider de la slice `purchase` (Context API + useReducer, SpecProject
 * 0/3.6). Se monta localmente en `/buy` (no en `App.tsx`) — el flujo de
 * compra no necesita sobrevivir fuera de esa ruta.
 */
export const PurchaseProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(purchaseReducer, initialPurchaseState)
  return <PurchaseContext value={{ state, dispatch }}>{children}</PurchaseContext>
}
