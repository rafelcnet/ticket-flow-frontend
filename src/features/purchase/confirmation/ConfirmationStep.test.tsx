import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationStep } from './ConfirmationStep'

const booking = {
  id: 'TF-583921',
  status: 'confirmed' as const,
  total: 158,
  currency: 'USD' as const,
  contactEmail: 'sofia.hernandez@ticketflow.com',
  paymentMethod: 'card' as const,
  transactionId: 'txn-583921',
  createdAt: '2026-07-04 15:31:00',
  cancelledAt: null,
  eventId: 'evt-001',
  eventName: 'Bad Liebre',
  eventDate: '2025-02-15',
  eventTime: '21:00',
  location: 'Ciudad de México, México',
  seatId: 'sea-002',
  row: 1,
  col: 2,
  zone: 'VIP',
}

const renderConfirmation = (onBuyAnother = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={['/buy']}>
      <Routes>
        <Route
          path="/buy"
          element={<ConfirmationStep booking={booking} onBuyAnother={onBuyAnother} />}
        />
        <Route path="/bookings" element={<p>Mis reservaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return onBuyAnother
}

describe('ConfirmationStep', () => {
  it('muestra el booking ID, el resumen del evento y a dónde se enviarán los tickets (Context.md 5.4 Paso 5)', () => {
    // Given / When: se confirma una reserva
    renderConfirmation()

    // Then: se ven todos los datos exigidos, tomados de la respuesta de POST /bookings
    expect(screen.getByText('¡Reservación confirmada!')).toBeInTheDocument()
    expect(screen.getByText('TF-583921')).toBeInTheDocument()
    expect(
      screen.getByText('Tus tickets se enviarán a sofia.hernandez@ticketflow.com'),
    ).toBeInTheDocument()
    expect(screen.getByText('Bad Liebre')).toBeInTheDocument()
    expect(screen.getByText('2025-02-15 · 21:00')).toBeInTheDocument()
    expect(screen.getByText('Fila 1, Columna 2 — VIP')).toBeInTheDocument()
    expect(screen.getByText('Total: $158.00 USD')).toBeInTheDocument()
  })

  it('navega a /bookings al pulsar "View my tickets"', async () => {
    // Given: la pantalla de confirmación
    const usuario = userEvent.setup()
    renderConfirmation()

    // When: pulsa "View my tickets"
    await usuario.click(screen.getByRole('button', { name: 'View my tickets' }))

    // Then: navega a la pantalla de reservaciones (Context.md 5.4 Paso 5)
    expect(await screen.findByText('Mis reservaciones')).toBeInTheDocument()
  })

  it('dispara onBuyAnother al pulsar "Buy another"', async () => {
    // Given: la pantalla de confirmación
    const usuario = userEvent.setup()
    const onBuyAnother = renderConfirmation()

    // When: pulsa "Buy another"
    await usuario.click(screen.getByRole('button', { name: 'Buy another' }))

    // Then: se notifica para que la slice purchase reinicie el stepper (BUY_ANOTHER)
    expect(onBuyAnother).toHaveBeenCalledOnce()
  })
})
