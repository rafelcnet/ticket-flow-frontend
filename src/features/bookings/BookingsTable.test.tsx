import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BookingsTable } from './BookingsTable'

const bookingConfirmado = {
  id: 'TF-001',
  status: 'confirmed' as const,
  total: 150,
  currency: 'USD' as const,
  contactEmail: 'sofia.hernandez@ticketflow.com',
  paymentMethod: 'card' as const,
  transactionId: 'txn-483920',
  createdAt: '2026-07-04 08:30:00',
  cancelledAt: null,
  eventId: 'evt-001',
  eventName: 'Bad Liebre',
  eventDate: '2025-02-15',
  eventTime: '21:00',
  location: 'Ciudad de México, México',
  seatId: 'sea-001',
  row: 1,
  col: 1,
  zone: 'VIP',
}

const bookingCancelado = { ...bookingConfirmado, id: 'TF-002', status: 'cancelled' as const }

describe('BookingsTable', () => {
  it('muestra evento, fecha, asiento, total y status de cada reserva (Context.md 5.5)', () => {
    // Given / When: se renderiza la tabla con una reserva
    render(
      <BookingsTable bookings={[bookingConfirmado]} cancellingId={null} onCancelClick={vi.fn()} />,
    )

    // Then: la información principal es visible
    expect(screen.getByText('TF-001')).toBeInTheDocument()
    expect(screen.getByText('Bad Liebre')).toBeInTheDocument()
    expect(screen.getByText('2025-02-15 · 21:00')).toBeInTheDocument()
    expect(screen.getByText('Fila 1, Columna 1 — VIP')).toBeInTheDocument()
    expect(screen.getByText('$150.00 USD')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('muestra el botón Cancelar sólo si el status es confirmed o pending (SpecBookings 4.3)', () => {
    // Given: una reserva confirmada y una ya cancelada
    render(
      <BookingsTable
        bookings={[bookingConfirmado, bookingCancelado]}
        cancellingId={null}
        onCancelClick={vi.fn()}
      />,
    )

    // Then: sólo hay un botón Cancelar, para la reserva confirmada
    expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(1)
  })

  it('notifica el id de la reserva al pulsar Cancelar', async () => {
    // Given: una reserva confirmada
    const usuario = userEvent.setup()
    const onCancelClick = vi.fn()
    render(
      <BookingsTable bookings={[bookingConfirmado]} cancellingId={null} onCancelClick={onCancelClick} />,
    )

    // When: el usuario pulsa Cancelar
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Then: se notifica el id de esa reserva
    expect(onCancelClick).toHaveBeenCalledWith('TF-001')
  })

  it('deshabilita el botón y cambia su texto mientras esa reserva se está cancelando', () => {
    // Given: la reserva TF-001 tiene una cancelación en curso
    render(
      <BookingsTable
        bookings={[bookingConfirmado]}
        cancellingId="TF-001"
        onCancelClick={vi.fn()}
      />,
    )

    // Then: el botón muestra el estado de envío y queda deshabilitado
    expect(screen.getByRole('button', { name: 'Cancelando…' })).toBeDisabled()
  })
})
