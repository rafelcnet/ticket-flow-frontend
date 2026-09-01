import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PurchasePage } from './PurchasePage'

describe('PurchasePage', () => {
  it('muestra el encabezado de la pantalla de compra', () => {
    // Given: la pantalla 3 del mapa de pantallas (Context.md 5.4)

    // When: se renderiza la pantalla
    render(<PurchasePage />)

    // Then: el usuario ve el título que identifica la pantalla
    expect(
      screen.getByRole('heading', { level: 1, name: 'Buy Tickets' }),
    ).toBeInTheDocument()
  })
})
