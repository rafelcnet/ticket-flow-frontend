import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BookingsPage } from './BookingsPage'

describe('BookingsPage', () => {
  it('muestra el encabezado de la pantalla de mis reservas', () => {
    // Given: la pantalla 4 del mapa de pantallas (Context.md 5.5)

    // When: se renderiza la pantalla
    render(<BookingsPage />)

    // Then: el usuario ve el título que identifica la pantalla
    expect(
      screen.getByRole('heading', { level: 1, name: 'My Bookings' }),
    ).toBeInTheDocument()
  })
})
