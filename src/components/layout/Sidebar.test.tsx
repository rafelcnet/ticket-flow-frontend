import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ROUTES } from '../../routes/routes.config'
import { Sidebar } from './Sidebar'

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

const renderSidebar = (
  props: Partial<Parameters<typeof Sidebar>[0]> = {},
  ruta: string = ROUTES.buy,
) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Sidebar user={usuario} onLogout={vi.fn()} {...props}>
        <p>contenido de la página</p>
      </Sidebar>
    </MemoryRouter>,
  )

describe('Sidebar', () => {
  it('muestra el wordmark de TicketFlow', () => {
    // Given: el shell de navegación de las pantallas autenticadas (SpecLayout 4.1)
    // When: se renderiza
    renderSidebar()

    // Then: la marca es visible
    expect(screen.getByText('Ticket')).toBeInTheDocument()
    expect(screen.getByText('Flow')).toBeInTheDocument()
  })

  it('ofrece enlaces habilitados a Buy tickets y My tickets (SpecLayout 4.2)', () => {
    // Given / When: se renderiza el sidebar
    renderSidebar()

    // Then: ambos enlaces apuntan a su ruta
    expect(screen.getByRole('link', { name: /Buy tickets/ })).toHaveAttribute(
      'href',
      ROUTES.buy,
    )
    expect(screen.getByRole('link', { name: /My tickets/ })).toHaveAttribute(
      'href',
      ROUTES.bookings,
    )
  })

  it('muestra Explore y Favorites deshabilitados con badge Soon, sin ser enlaces', () => {
    // Given: funcionalidad futura marcada como // TODO (Context.md 9, SpecLayout 4.2)
    // When: se renderiza el sidebar
    renderSidebar()

    // Then: no son navegables y llevan el badge "Soon"
    expect(screen.getByText(/Explore/)).toBeInTheDocument()
    expect(screen.getByText(/Favorites/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Explore/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Favorites/ })).not.toBeInTheDocument()
    expect(screen.getAllByText('Soon')).toHaveLength(2)
  })

  it('no ofrece un enlace a Home en el menú (SpecLayout 4.2, sin ítem propio)', () => {
    // Given / When: se renderiza el sidebar
    renderSidebar()

    // Then: no existe un enlace de navegación llamado "Home"
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('resalta el ítem de la ruta actual como activo', () => {
    // Given: el usuario está en /bookings
    // When: se renderiza el sidebar en esa ruta
    renderSidebar({}, ROUTES.bookings)

    // Then: sólo el enlace de esa ruta queda marcado como activo
    const enlaceActivo = screen.getByRole('link', { name: /My tickets/ })
    const enlaceInactivo = screen.getByRole('link', { name: /Buy tickets/ })
    expect(enlaceActivo.className).not.toBe(enlaceInactivo.className)
  })

  it('muestra el nombre y el correo del usuario autenticado', () => {
    // Given: hay un usuario autenticado (Context.md 5.3)
    // When: se renderiza el sidebar
    renderSidebar()

    // Then: se ven su nombre completo y su correo
    expect(screen.getByText('Sofía Hernández')).toBeInTheDocument()
    expect(screen.getByText('sofia.hernandez@ticketflow.com')).toBeInTheDocument()
  })

  it('no muestra el resumen de usuario mientras el perfil aún no llegó', () => {
    // Given: el perfil todavía no se resolvió (justo después de un reload)
    // When: se renderiza el sidebar con user = null
    renderSidebar({ user: null })

    // Then: no se muestra un resumen de usuario vacío ni el botón de logout
    expect(screen.queryByText('sofia.hernandez@ticketflow.com')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  it('llama a onLogout al pulsar el botón Logout', async () => {
    // Given: el usuario está autenticado
    const manejarLogout = vi.fn()
    const usuarioInteraccion = userEvent.setup()
    renderSidebar({ onLogout: manejarLogout })

    // When: pulsa el botón Logout
    await usuarioInteraccion.click(screen.getByRole('button', { name: 'Logout' }))

    // Then: se invoca el callback recibido por props
    expect(manejarLogout).toHaveBeenCalledOnce()
  })

  it('renderiza el contenido recibido como children en el área principal', () => {
    // Given / When: se renderiza el sidebar con contenido
    renderSidebar()

    // Then: el contenido aparece en la página
    expect(screen.getByText('contenido de la página')).toBeInTheDocument()
  })
})
