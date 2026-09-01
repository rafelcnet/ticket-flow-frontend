import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRouter } from './AppRouter'
import { ROUTES } from './routes.config'

/** Sitúa el navegador simulado en una ruta antes de montar el router. */
const situarEn = (ruta: string) => {
  window.history.pushState({}, '', ruta)
}

const encabezado = (nombre: string) =>
  screen.getByRole('heading', { level: 1, name: nombre })

describe('AppRouter', () => {
  beforeEach(() => {
    situarEn('/')
  })

  it('muestra la pantalla de login en la ruta /login', () => {
    // Given: el usuario abre la ruta de login
    situarEn(ROUTES.login)

    // When: se monta el router
    render(<AppRouter />)

    // Then: se renderiza la pantalla de login
    expect(encabezado('Login')).toBeInTheDocument()
  })

  it('muestra la pantalla de inicio en la ruta /home', () => {
    // Given: el usuario abre la ruta de inicio
    situarEn(ROUTES.home)

    // When: se monta el router
    render(<AppRouter />)

    // Then: se renderiza la pantalla de inicio
    expect(encabezado('Home')).toBeInTheDocument()
  })

  it('muestra la pantalla de compra en la ruta /buy', () => {
    // Given: el usuario abre la ruta de compra
    situarEn(ROUTES.buy)

    // When: se monta el router
    render(<AppRouter />)

    // Then: se renderiza la pantalla de compra
    expect(encabezado('Buy Tickets')).toBeInTheDocument()
  })

  it('muestra la pantalla de reservas en la ruta /bookings', () => {
    // Given: el usuario abre la ruta de reservas
    situarEn(ROUTES.bookings)

    // When: se monta el router
    render(<AppRouter />)

    // Then: se renderiza la pantalla de reservas
    expect(encabezado('My Bookings')).toBeInTheDocument()
  })

  it('envuelve las pantallas autenticadas en el shell de navegación', () => {
    // Given: el usuario abre una ruta autenticada
    situarEn(ROUTES.home)

    // When: se monta el router
    render(<AppRouter />)

    // Then: la pantalla se acompaña de la navegación lateral
    expect(screen.getByRole('link', { name: 'Buy Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Bookings' })).toBeInTheDocument()
  })

  it('deja el login fuera del shell de navegación', () => {
    // Given: el usuario abre la ruta de login
    situarEn(ROUTES.login)

    // When: se monta el router
    render(<AppRouter />)

    // Then: la pantalla de login no muestra la navegación de la app
    expect(screen.queryByRole('link', { name: 'Buy Tickets' })).not.toBeInTheDocument()
  })

  it('redirige al login cuando la ruta no existe', () => {
    // Given: el usuario abre una ruta desconocida
    situarEn('/ruta-inexistente')

    // When: se monta el router
    render(<AppRouter />)

    // Then: se le devuelve a la pantalla de login
    expect(encabezado('Login')).toBeInTheDocument()
    expect(window.location.pathname).toBe(ROUTES.login)
  })

  it('redirige al login desde la raíz de la aplicación', () => {
    // Given: el usuario abre la raíz del sitio
    situarEn('/')

    // When: se monta el router
    render(<AppRouter />)

    // Then: se le devuelve a la pantalla de login
    expect(encabezado('Login')).toBeInTheDocument()
    expect(window.location.pathname).toBe(ROUTES.login)
  })

  it('sustituye la entrada del historial al redirigir, para no romper el botón atrás', () => {
    // Given: el usuario abre una ruta desconocida
    situarEn('/ruta-inexistente')
    const entradasPrevias = window.history.length

    // When: se monta el router y ocurre la redirección
    render(<AppRouter />)

    // Then: la redirección reemplaza la entrada en vez de apilar una nueva
    expect(window.history.length).toBe(entradasPrevias)
  })
})
