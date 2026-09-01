import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('muestra el encabezado de la pantalla de inicio', () => {
    // Given: la pantalla 2 del mapa de pantallas (Context.md 5.3)

    // When: se renderiza la pantalla
    render(<HomePage />)

    // Then: el usuario ve el título que identifica la pantalla
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })
})
