import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { ROUTES } from './routes/routes.config'

describe('App', () => {
  it('monta el router de la aplicación en lugar de una pantalla fija', () => {
    // Given: el usuario abre la ruta de reservas
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
})
