import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../../routes/routes.config'
import styles from './AppLayout.module.css'

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.buy, label: 'Buy Tickets' },
  { to: ROUTES.bookings, label: 'My Bookings' },
]

/**
 * Shell de navegación compartido por las pantallas autenticadas (5.3).
 * Versión inicial: sólo estructura y navegación; el perfil de usuario y el
 * resto del contenido del sidebar llegan con su ticket correspondiente.
 */
export const AppLayout = () => (
  <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <span className={styles.wordmark}>
        Ticket<span className={styles.wordmarkAccent}>Flow</span>
      </span>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <main className={styles.content}>
      <Outlet />
    </main>
  </div>
)
