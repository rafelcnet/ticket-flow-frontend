import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { SoonBadge } from '../badges/SoonBadge'
import type { User } from '../../schemas/user.schema'
import { ROUTES } from '../../routes/routes.config'
import styles from './Sidebar.module.css'

interface SidebarProps {
  user: User | null
  onLogout: () => void
  children: ReactNode
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink

/**
 * Shell de navegación compartido (SpecLayout 4) — componente de presentación
 * puro: no hace fetch, no conoce la slice `auth` ni `hasToken()` (SpecLayout
 * 2). El ítem activo se deriva de la URL vía `NavLink`, sin duplicar ese
 * estado (SpecLayout 5).
 */
export const Sidebar = ({ user, onLogout, children }: SidebarProps) => (
  <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <span className={styles.wordmark}>
        Ticket<span className={styles.wordmarkAccent}>Flow</span>
      </span>

      <nav className={styles.nav}>
        <NavLink to={ROUTES.buy} className={navLinkClassName}>
          🎫 Buy tickets
        </NavLink>
        <NavLink to={ROUTES.bookings} className={navLinkClassName}>
          📋 My tickets
        </NavLink>
        <span className={styles.navLinkDisabled}>
          🔍 Explore <SoonBadge />
        </span>
        <span className={styles.navLinkDisabled}>
          ❤️ Favorites <SoonBadge />
        </span>
      </nav>

      <div className={styles.spacer} />

      {user && (
        <div className={styles.userSummary}>
          <span className={styles.userName}>
            {user.name} {user.lastname}
          </span>
          <span className={styles.userEmail}>{user.email}</span>
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </aside>
    <main className={styles.content}>{children}</main>
  </div>
)
