import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../features/home/AppShell'
import { BookingsPage } from '../features/bookings/BookingsPage'
import { HomePage } from '../features/home/HomePage'
import { LoginPage } from '../features/login/LoginPage'
import { PurchasePage } from '../features/purchase/PurchasePage'
import { RequireAuth } from './RequireAuth'
import { ROUTES } from './routes.config'

/**
 * Configuración de rutas de Context.md 8.5.
 * `/login` vive fuera del shell de navegación; `/home`, `/buy` y `/bookings`
 * comparten el shell de `AppShell` (5.1) y quedan protegidas por una única
 * guarda `RequireAuth` (SpecLayout 3 — se aplica una sola vez para las tres,
 * no repetida por ruta).
 */
export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.buy} element={<PurchasePage />} />
          <Route path={ROUTES.bookings} element={<BookingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  </BrowserRouter>
)
