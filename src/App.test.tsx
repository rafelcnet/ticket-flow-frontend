import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { notifyGlobalError } from './http/error-bus'
import { clearToken, saveToken } from './http/token.storage'
import { ROUTES } from './routes/routes.config'
import { getProfile } from './services/users.service'

vi.mock('./services/users.service')

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getProfile).mockResolvedValue({
      id: 'usr-001',
      name: 'Sofía',
      lastname: 'Hernández',
      email: 'sofia.hernandez@ticketflow.com',
      phone: '+525511223344',
    })
  })

  afterEach(() => {
    clearToken()
    vi.resetAllMocks()
  })

  it('monta el router de la aplicación en lugar de una pantalla fija', () => {
    // Given: el usuario, ya autenticado, abre la ruta de reservas
    saveToken('tok_abc123')
    window.history.pushState({}, '', ROUTES.bookings)

    // When: se renderiza la composición raíz
    render(<App />)

    // Then: la raíz delega en el router y resuelve la ruta pedida
    expect(
      screen.getByRole('heading', { level: 1, name: 'My Bookings' }),
    ).toBeInTheDocument()
  })

  it('ya no muestra el contenido de la plantilla inicial de Vite', () => {
    // Given: la composición raíz sustituyó a la plantilla de ejemplo
    window.history.pushState({}, '', ROUTES.login)

    // When: se renderiza la composición raíz
    render(<App />)

    // Then: no queda rastro del contador ni de los enlaces de la plantilla
    expect(screen.queryByRole('button', { name: /count is/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Get started/i)).not.toBeInTheDocument()
  })

  it('muestra los toasts globales de red desde cualquier pantalla (SpecHttp 4.2)', async () => {
    // Given: la aplicación está montada en cualquier ruta
    window.history.pushState({}, '', ROUTES.home)
    render(<App />)

    // When: el interceptor de response notifica un error 500
    notifyGlobalError('Ocurrió un error inesperado. Intenta nuevamente.')

    // Then: el ToastViewport, montado junto al router, muestra el mensaje
    expect(
      await screen.findByText('Ocurrió un error inesperado. Intenta nuevamente.'),
    ).toBeInTheDocument()
  })
})
