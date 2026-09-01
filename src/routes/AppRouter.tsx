import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { BookingsPage } from '../features/bookings/BookingsPage'
import { HomePage } from '../features/home/HomePage'
import { LoginPage } from '../features/login/LoginPage'
import { PurchasePage } from '../features/purchase/PurchasePage'
import { ROUTES } from './routes.config'

/**
 * Configuración de rutas de Context.md 8.5.
 * `/login` vive fuera del shell de navegación; `/home`, `/buy` y `/bookings`
 * comparten el layout de Home (5.1).
 *
 * Pendiente (TF-2 / SpecHttp): la guarda de ruta que resuelve por `hasToken()`
 * (8.2, 8.5). El módulo de Token Storage pertenece a la capa `http/` y aún no
 * existe, por lo que aquí no se anticipa su interfaz.
 */
// TODO UNIT TEST
export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.buy} element={<PurchasePage />} />
        <Route path={ROUTES.bookings} element={<BookingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  </BrowserRouter>
)
