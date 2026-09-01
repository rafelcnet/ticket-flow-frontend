import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('muestra el encabezado de la pantalla de login', () => {
    // Given: la pantalla 1 del mapa de pantallas (Context.md 5.2)

    // When: se renderiza la pantalla
    render(<LoginPage />)

    // Then: el usuario ve el título que identifica la pantalla
    expect(screen.getByRole('heading', { level: 1, name: 'Login' })).toBeInTheDocument()
  })
})
