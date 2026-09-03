import { useContext } from 'react'
import { PurchaseContext } from '../state/purchase/purchase.context'

/** Acceso a la slice `purchase` (SpecProject 3.2: hook compartido, prefijo `use`). */
export const usePurchase = () => {
  const context = useContext(PurchaseContext)
  if (!context) {
    throw new Error('usePurchase debe usarse dentro de un PurchaseProvider')
  }
  return context
}
