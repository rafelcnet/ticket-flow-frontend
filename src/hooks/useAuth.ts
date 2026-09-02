import { useContext } from 'react'
import { AuthContext } from '../state/auth/auth.context'

/** Acceso a la slice `auth` (SpecProject 3.2: hook compartido, prefijo `use`). */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
