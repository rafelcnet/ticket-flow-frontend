import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../state/auth/auth.context'
import { getPaginatedEvents } from '../../services/events.service'
import { getSeatMap } from '../../services/seats.service'
import { processPayment } from '../../services/payment.service'
import { createBooking } from '../../services/bookings.service'
import { PurchasePage } from './PurchasePage'

vi.mock('../../services/events.service')
vi.mock('../../services/seats.service')
vi.mock('../../services/payment.service')
vi.mock('../../services/bookings.service')

const eventos = [
  {
    id: 'evt-001',
    venueId: 'ven-001',
    name: 'Bad Liebre',
    date: '2025-02-15',
    time: '21:00',
    location: 'Ciudad de México, México',
    imageUrl: 'https://example.com/bad-liebre.png',
    basePrice: 150,
    currency: 'USD' as const,
  },
]

const seatMapArenaResponse = {
  eventId: 'evt-001',
  venueType: 'arena' as const,
  zones: [{ id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 }],
  seats: [{ seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'available' as const }],
}

const respuestaPagoAprobado = {
  transactionId: 'txn-583921',
  status: 'approved' as const,
  message: 'Payment approved. You will receive a confirmation email.',
  processedAt: '2026-07-04T15:30:00.000Z',
}

const reservaCreada = {
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
  seatId: 'sea-001',
  row: 1,
  col: 1,
  zone: 'VIP',
}

const renderPurchasePage = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/buy']}>
        <PurchasePage />
      </MemoryRouter>
    </AuthProvider>,
  )

describe('PurchasePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getPaginatedEvents).mockResolvedValue({
      data: eventos,
      pagination: { page: 1, limit: 6, total: eventos.length, totalPages: 1 },
    })
    vi.mocked(getSeatMap).mockResolvedValue(seatMapArenaResponse)
    vi.mocked(processPayment).mockResolvedValue(respuestaPagoAprobado)
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
  })

  it('muestra el header del stepper y el Paso 1 al entrar a /buy', async () => {
    // Given: el usuario entra a la pantalla de compra (Context.md 5.4)
    // When: se renderiza la pantalla
    renderPurchasePage()

    // Then: el stepper es visible y arranca en Select Event
    expect(screen.getByText('Select Event')).toBeInTheDocument()
    expect(await screen.findByText('Bad Liebre')).toBeInTheDocument()
  })

  it('recorre los 5 pasos completos, del catálogo de eventos a la confirmación de la compra', async () => {
    // Given: el catálogo de eventos, el mapa de asientos, el pago y la reserva están disponibles
    const usuario = userEvent.setup()
    renderPurchasePage()
    const card = await screen.findByRole('button', { name: /Bad Liebre/ })

    // When: elige el evento y avanza al Paso 2
    await usuario.click(card)
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: ve el formulario de datos de contacto
    expect(await screen.findByLabelText('First name')).toBeInTheDocument()

    // When: llena el formulario (sin perfil precargado) y avanza al Paso 3
    await usuario.type(screen.getByLabelText('First name'), 'Sofía')
    await usuario.type(screen.getByLabelText('Last name'), 'Hernández')
    await usuario.type(screen.getByLabelText('Email'), 'sofia.hernandez@ticketflow.com')
    await usuario.type(screen.getByLabelText('Phone'), '+525511223344')
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: ve el mapa de asientos del venue del evento (Context.md 5.4 Paso 3)
    expect(getSeatMap).toHaveBeenCalledWith('evt-001')
    const asiento = await screen.findByRole('button', { name: 'Fila 1, columna 1' })

    // When: elige el asiento disponible y avanza al Paso 4
    await usuario.click(asiento)
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: ve el resumen de pago con el asiento ya resuelto
    expect(await screen.findByText('Precio base: $150.00')).toBeInTheDocument()

    // When: completa el formulario de tarjeta y paga
    await usuario.type(screen.getByLabelText('Card number'), '4111111111111111')
    await usuario.type(screen.getByLabelText('Expiration date'), '1228')
    await usuario.type(screen.getByLabelText('CVV'), '123')
    await usuario.type(screen.getByLabelText('Cardholder name'), 'Sofía Hernández')
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: llega al Paso 5 con la reserva confirmada (Context.md 5.4 Paso 5)
    expect(await screen.findByText('¡Reservación confirmada!')).toBeInTheDocument()
    expect(screen.getByText('TF-583921')).toBeInTheDocument()
  })

  it('conserva el evento y los datos de contacto al volver del Paso 2 al Paso 1', async () => {
    // Given: el usuario ya avanzó al Paso 2 con un evento elegido
    const usuario = userEvent.setup()
    renderPurchasePage()
    const card = await screen.findByRole('button', { name: /Bad Liebre/ })
    await usuario.click(card)
    await usuario.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByLabelText('First name')

    // When: pulsa Back
    await usuario.click(screen.getByRole('button', { name: 'Back' }))

    // Then: vuelve al Paso 1 con el mismo evento ya resaltado (no se perdió la selección)
    const cardDeVuelta = await screen.findByRole('button', { name: /Bad Liebre/ })
    expect(cardDeVuelta).toHaveAttribute('aria-pressed', 'true')
  })
})
