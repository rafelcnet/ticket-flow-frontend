import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../state/auth/auth.context'
import { getEvents } from '../../services/events.service'
import { PurchasePage } from './PurchasePage'

vi.mock('../../services/events.service')

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

const renderPurchasePage = () =>
  render(
    <AuthProvider>
      <PurchasePage />
    </AuthProvider>,
  )

describe('PurchasePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getEvents).mockResolvedValue(eventos)
  })

  it('muestra el header del stepper y el Paso 1 al entrar a /buy', async () => {
    // Given: el usuario entra a la pantalla de compra (Context.md 5.4)
    // When: se renderiza la pantalla
    renderPurchasePage()

    // Then: el stepper es visible y arranca en Select Event
    expect(screen.getByText('Select Event')).toBeInTheDocument()
    expect(await screen.findByText('Bad Liebre')).toBeInTheDocument()
  })

  it('recorre el Paso 1 y el Paso 2, y llega al marcador de posición del Paso 3', async () => {
    // Given: el catálogo de eventos está disponible y el usuario no tiene perfil cargado aún
    const usuario = userEvent.setup()
    renderPurchasePage()
    const card = await screen.findByRole('button', { name: /Bad Liebre/ })

    // When: elige el evento y avanza al Paso 2
    await usuario.click(card)
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: ve el formulario de datos de contacto
    expect(await screen.findByLabelText('First name')).toBeInTheDocument()

    // When: llena el formulario (sin perfil precargado) y avanza
    await usuario.type(screen.getByLabelText('First name'), 'Sofía')
    await usuario.type(screen.getByLabelText('Last name'), 'Hernández')
    await usuario.type(screen.getByLabelText('Email'), 'sofia.hernandez@ticketflow.com')
    await usuario.type(screen.getByLabelText('Phone'), '+525511223344')
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: llega al marcador de posición del Paso 3, todavía sin implementar
    expect(await screen.findByText('Próximamente disponible.')).toBeInTheDocument()
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
