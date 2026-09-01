import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '../../routes/routes.config'
import { AppLayout } from './AppLayout'

/**
 * Monta el layout como ruta padre, igual que en AppRouter, para que el
 * `Outlet` tenga contenido que renderizar.
 */
const renderizarLayout = (rutaInicial: string) =>
  render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.home} element={<p>Contenido de Home</p>} />
          <Route path={ROUTES.buy} element={<p>Contenido de Buy</p>} />
          <Route path={ROUTES.bookings} element={<p>Contenido de Bookings</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AppLayout', () => {
  it('muestra el wordmark de TicketFlow en el sidebar', () => {
    // Given: el shell de navegación de las pantallas autenticadas

    // When: se renderiza el layout
    renderizarLayout(ROUTES.home)

    // Then: la marca es visible (Context.md 2.3)
    expect(screen.getByText('Ticket')).toBeInTheDocument()
    expect(screen.getByText('Flow')).toBeInTheDocument()
  })

  it('ofrece un enlace de navegación por cada pantalla autenticada', () => {
    // Given: las tres pantallas que viven dentro del shell (Context.md 5.1)

    // When: se renderiza el layout
    renderizarLayout(ROUTES.home)

    // Then: cada enlace apunta a su ruta correspondiente
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      ROUTES.home,
    )
    expect(screen.getByRole('link', { name: 'Buy Tickets' })).toHaveAttribute(
      'href',
      ROUTES.buy,
    )
    expect(screen.getByRole('link', { name: 'My Bookings' })).toHaveAttribute(
      'href',
      ROUTES.bookings,
    )
  })

  it('no expone el login como enlace de navegación', () => {
    // Given: el login vive fuera del shell autenticado (Context.md 5.1)

    // When: se renderiza el layout
    renderizarLayout(ROUTES.home)

    // Then: no hay forma de volver al login desde la navegación
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('renderiza el contenido de la ruta activa dentro del layout', () => {
    // Given: el usuario está situado en la ruta de compra
    // When: se renderiza el layout
    renderizarLayout(ROUTES.buy)

    // Then: el Outlet muestra el contenido de esa ruta
    expect(screen.getByText('Contenido de Buy')).toBeInTheDocument()
    expect(screen.queryByText('Contenido de Home')).not.toBeInTheDocument()
  })

  it('marca como activo únicamente el enlace de la ruta actual', () => {
    // Given: el usuario está situado en la ruta de reservas
    renderizarLayout(ROUTES.bookings)

    // When: se comparan las clases de los enlaces
    const enlaceActivo = screen.getByRole('link', { name: 'My Bookings' })
    const enlaceInactivo = screen.getByRole('link', { name: 'Home' })

    // Then: sólo el enlace de la ruta actual recibe la clase de estado activo
    expect(enlaceActivo.className).not.toBe(enlaceInactivo.className)
    expect(enlaceActivo.className.split(' ').length).toBeGreaterThan(
      enlaceInactivo.className.split(' ').length,
    )
  })

  it('navega a la pantalla elegida al pulsar un enlace del sidebar', async () => {
    // Given: el usuario está en la pantalla de inicio
    const usuario = userEvent.setup()
    renderizarLayout(ROUTES.home)

    // When: pulsa el enlace de My Bookings
    await usuario.click(screen.getByRole('link', { name: 'My Bookings' }))

    // Then: el layout se mantiene y el contenido cambia al de la nueva ruta
    expect(screen.getByText('Contenido de Bookings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })
})
