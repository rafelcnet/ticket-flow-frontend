import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('muestra "Confirmed" para una reserva confirmed (Context.md 5.5)', () => {
    // Given / When: se renderiza el badge de una reserva confirmada
    render(<StatusBadge status="confirmed" />)

    // Then: se ve la etiqueta correspondiente
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('muestra "Pending" para una reserva pending (Context.md 5.5)', () => {
    // Given / When: se renderiza el badge de una reserva pendiente
    render(<StatusBadge status="pending" />)

    // Then: se ve la etiqueta correspondiente
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('muestra "Cancelled" para una reserva cancelled (Context.md 5.5)', () => {
    // Given / When: se renderiza el badge de una reserva cancelada
    render(<StatusBadge status="cancelled" />)

    // Then: se ve la etiqueta correspondiente
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })
})
