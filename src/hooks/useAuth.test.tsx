import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../state/auth/auth.context'
import { useAuth } from './useAuth'

/** Componente sin manejar el error, para que React lo reporte como fallo del render. */
const ConsumerFueraDeProvider = () => {
  useAuth()
  return null
}

const ConsumerDentroDeProvider = () => {
  const { state } = useAuth()
  return <p>isAuthenticated: {String(state.isAuthenticated)}</p>
}

describe('useAuth', () => {
  // React registra en consola el error de render que se espera en este caso.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lanza un error si se usa fuera de un AuthProvider', () => {
    // Given: un componente que llama a useAuth sin ningún AuthProvider como ancestro
    // When / Then: el render falla con un mensaje claro, no con un error críptico de React
    expect(() => render(<ConsumerFueraDeProvider />)).toThrow(
      'useAuth debe usarse dentro de un AuthProvider',
    )
  })

  it('devuelve el estado y el dispatch de la slice auth cuando sí hay un AuthProvider', () => {
    // Given: el componente está dentro de un AuthProvider
    // When: se renderiza
    render(
      <AuthProvider>
        <ConsumerDentroDeProvider />
      </AuthProvider>,
    )

    // Then: obtiene el estado inicial de la slice, sin lanzar ningún error
    expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument()
  })
})
