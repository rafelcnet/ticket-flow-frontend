import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../routes/routes.config'
import { logout } from '../../services/auth.service'
import { clearEventsCache } from '../../services/events.service'
import { getProfile } from '../../services/users.service'

/**
 * Orquesta el shell compartido de `/home`, `/buy` y `/bookings` (SpecLayout
 * 2, SpecProject "home → layout de navegación + perfil"). Refresca el
 * perfil autenticado al montar — rehidrata la slice `auth` tras un reload,
 * ya que el token persiste en `localStorage` pero el estado de React no
 * (Context.md 5.3: "On load → GET /users/me") — y conecta Logout con
 * `auth.service`. No renderiza el sidebar directamente: le pasa datos ya
 * resueltos a `components/layout/Sidebar`, que es quien lo dibuja.
 */
export const AppShell = () => {
  const { state, dispatch } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((user) => {
        if (!cancelled) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user } })
        }
      })
      .catch(() => {
        // 401 → el interceptor global ya limpia el token y redirige (SpecHttp
        // 4.2). Cualquier otro código ya muestra su toast genérico ahí mismo.
      })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const handleLogout = async () => {
    try {
      await logout()
      dispatch({ type: 'LOGOUT' })
      clearEventsCache()
      navigate(ROUTES.login)
    } catch {
      // 401 → ya resuelto por el interceptor global; otros errores ya
      // muestran su toast genérico (SpecHttp 4.2) — nada más que hacer aquí.
    }
  }

  return (
    <Sidebar user={state.user} onLogout={handleLogout}>
      <Outlet />
    </Sidebar>
  )
}
