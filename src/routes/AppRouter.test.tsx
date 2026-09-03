import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearToken, saveToken } from '../http/token.storage'
import { getPaginatedEvents } from '../services/events.service'
import { getProfile } from '../services/users.service'
import { AuthProvider } from '../state/auth/auth.context'
import { AppRouter } from './AppRouter'
import { ROUTES } from './routes.config'

vi.mock('../services/users.service')
vi.mock('../services/events.service')

/** Sitúa el navegador simulado en una ruta antes de montar el router. */
const situarEn = (ruta: string) => {
  window.history.pushState({}, '', ruta)
}

const encabezado = (nombre: string) =>
  screen.getByRole('heading', { level: 1, name: nombre })

/** `LoginPage` exige un `AuthProvider` en el árbol desde TF-3. */
const renderRouter = () =>
  render(
    <AuthProvider>
      <AppRouter />
    </AuthProvider>,
  )

const usuario = {
  id: 'usr-001',
  name: 'Sofía',
  lastname: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

describe('AppRouter', () => {
  beforeEach(() => {
    situarEn('/')
    vi.mocked(getProfile).mockResolvedValue(usuario)
    vi.mocked(getPaginatedEvents).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
    })
  })

  afterEach(() => {
    clearToken()
    vi.resetAllMocks()
  })

  it('muestra la pantalla de login en la ruta /login', () => {
    // Given: el usuario abre la ruta de login
    situarEn(ROUTES.login)

    // When: se monta el router
    renderRouter()

    // Then: se renderiza la pantalla de login
    expect(
      screen.getByRole('heading', { level: 1, name: 'TicketFlow' }),
    ).toBeInTheDocument()
  })

  it('redirige al login si intenta entrar a /home sin haber iniciado sesión (Context.md 8.5)', () => {
    // Given: no hay ningún token guardado
    situarEn(ROUTES.home)

    // When: se monta el router
    renderRouter()

    // Then: la guarda lo devuelve a /login en vez de renderizar el shell
    expect(
      screen.getByRole('heading', { level: 1, name: 'TicketFlow' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe(ROUTES.login)
  })

  it('muestra la pantalla de inicio en /home cuando hay una sesión activa', () => {
    // Given: el usuario ya inició sesión
    saveToken('tok_abc123')
    situarEn(ROUTES.home)

    // When: se monta el router
    renderRouter()

    // Then: se renderiza la pantalla de inicio
    expect(encabezado('Home')).toBeInTheDocument()
  })

  it('muestra la pantalla de compra en /buy cuando hay una sesión activa', () => {
    // Given: el usuario ya inició sesión
    saveToken('tok_abc123')
    situarEn(ROUTES.buy)

    // When: se monta el router
    renderRouter()

    // Then: se renderiza el stepper de compra, arrancando en Select Event
    expect(screen.getByText('Select Event')).toBeInTheDocument()
  })

  it('muestra la pantalla de reservas en /bookings cuando hay una sesión activa', () => {
    // Given: el usuario ya inició sesión
    saveToken('tok_abc123')
    situarEn(ROUTES.bookings)

    // When: se monta el router
    renderRouter()

    // Then: se renderiza la pantalla de reservas
    expect(encabezado('My Bookings')).toBeInTheDocument()
  })

  it('envuelve las pantallas autenticadas en el shell de navegación', () => {
    // Given: el usuario ya inició sesión
    saveToken('tok_abc123')
    situarEn(ROUTES.home)

    // When: se monta el router
    renderRouter()

    // Then: la pantalla se acompaña de la navegación lateral (SpecLayout 4.2)
    expect(screen.getByRole('link', { name: /Buy tickets/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /My tickets/ })).toBeInTheDocument()
  })

  it('deja el login fuera del shell de navegación', () => {
    // Given: el usuario abre la ruta de login
    situarEn(ROUTES.login)

    // When: se monta el router
    renderRouter()

    // Then: la pantalla de login no muestra la navegación de la app
    expect(screen.queryByRole('link', { name: /Buy tickets/ })).not.toBeInTheDocument()
  })

  it('redirige al login cuando la ruta no existe', () => {
    // Given: el usuario abre una ruta desconocida
    situarEn('/ruta-inexistente')

    // When: se monta el router
    renderRouter()

    // Then: se le devuelve a la pantalla de login
    expect(
      screen.getByRole('heading', { level: 1, name: 'TicketFlow' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe(ROUTES.login)
  })

  it('redirige al login desde la raíz de la aplicación', () => {
    // Given: el usuario abre la raíz del sitio
    situarEn('/')

    // When: se monta el router
    renderRouter()

    // Then: se le devuelve a la pantalla de login
    expect(
      screen.getByRole('heading', { level: 1, name: 'TicketFlow' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe(ROUTES.login)
  })

  it('sustituye la entrada del historial al redirigir, para no romper el botón atrás', () => {
    // Given: el usuario abre una ruta desconocida
    situarEn('/ruta-inexistente')
    const entradasPrevias = window.history.length

    // When: se monta el router y ocurre la redirección
    renderRouter()

    // Then: la redirección reemplaza la entrada en vez de apilar una nueva
    expect(window.history.length).toBe(entradasPrevias)
  })
})
