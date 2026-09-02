import { Navigate, Outlet } from 'react-router-dom'
import { hasToken } from '../http/token.storage'
import { ROUTES } from './routes.config'

/**
 * Guarda de ruta (Context.md 8.5, SpecLayout 3): antes de renderizar el
 * shell compartido de `/home`, `/buy` y `/bookings`, comprueba `hasToken()`
 * una sola vez para las tres — no lee la slice `auth` (SpecAuth 4, SpecLayout
 * 2), para no depender de que esa slice ya se haya rehidratado.
 */
export const RequireAuth = () =>
  hasToken() ? <Outlet /> : <Navigate to={ROUTES.login} replace />
