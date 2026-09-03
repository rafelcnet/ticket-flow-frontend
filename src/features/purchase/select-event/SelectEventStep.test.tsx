import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePurchase } from '../../../hooks/usePurchase'
import { getEvents } from '../../../services/events.service'
import { PurchaseProvider } from '../../../state/purchase/purchase.context'
import { SelectEventStep } from './SelectEventStep'

vi.mock('../../../services/events.service')

const PurchaseStateProbe = () => {
  const { state } = usePurchase()
  return (
    <p>
      currentStep: {state.currentStep} — selectedEvent:{' '}
      {state.selectedEvent?.name ?? 'ninguno'}
    </p>
  )
}

const renderStep = () =>
  render(
    <PurchaseProvider>
      <SelectEventStep />
      <PurchaseStateProbe />
    </PurchaseProvider>,
  )

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
  {
    id: 'evt-002',
    venueId: 'ven-002',
    name: 'Cine Bajo Las Estrellas',
    date: '2025-03-01',
    time: '19:30',
    location: 'Guadalajara, México',
    imageUrl: 'https://example.com/cine.png',
    basePrice: 75,
    currency: 'USD' as const,
  },
]

describe('SelectEventStep', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('pide el catálogo de eventos al montar y muestra un estado de carga mientras tanto', () => {
    // Given: la petición del catálogo está en curso
    vi.mocked(getEvents).mockReturnValue(new Promise(() => {}))

    // When: se monta el paso
    renderStep()

    // Then: se llama al servicio y se muestra un estado de carga
    expect(getEvents).toHaveBeenCalledOnce()
    expect(screen.getByText('Cargando eventos…')).toBeInTheDocument()
  })

  it('muestra nombre, fecha, ubicación y precio de cada evento (Context.md 5.4 Paso 1)', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getEvents).mockResolvedValue(eventos)

    // When: se monta el paso
    renderStep()

    // Then: la información básica de cada evento es visible
    expect(await screen.findByText('Bad Liebre')).toBeInTheDocument()
    expect(screen.getByText('2025-02-15 · 21:00')).toBeInTheDocument()
    expect(screen.getByText('Ciudad de México, México')).toBeInTheDocument()
    expect(screen.getByText('Desde $150.00 USD')).toBeInTheDocument()
    expect(screen.getByText('Cine Bajo Las Estrellas')).toBeInTheDocument()
  })

  it('muestra un mensaje cuando no hay ningún evento disponible', async () => {
    // Given: el catálogo está vacío
    vi.mocked(getEvents).mockResolvedValue([])

    // When: se monta el paso
    renderStep()

    // Then: se informa que no hay eventos
    expect(
      await screen.findByText('No hay eventos disponibles por ahora.'),
    ).toBeInTheDocument()
  })

  it('carga las imágenes de forma perezosa (Context.md 10, NFR de performance)', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getEvents).mockResolvedValue(eventos)

    // When: se monta el paso
    renderStep()

    // Then: las imágenes usan loading="lazy"
    const imagen = await screen.findByAltText('Bad Liebre')
    expect(imagen).toHaveAttribute('loading', 'lazy')
  })

  it('mantiene el botón Next deshabilitado hasta elegir un evento', async () => {
    // Given: el catálogo tiene eventos, pero ninguno elegido todavía
    vi.mocked(getEvents).mockResolvedValue(eventos)
    renderStep()
    await screen.findByText('Bad Liebre')

    // When / Then: el botón sigue deshabilitado
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('resalta la card elegida al hacer click y habilita el botón Next', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getEvents).mockResolvedValue(eventos)
    const usuario = userEvent.setup()
    renderStep()
    const card = await screen.findByRole('button', { name: /Bad Liebre/ })

    // When: el usuario hace click en una card
    await usuario.click(card)

    // Then: la card queda marcada como seleccionada y Next se habilita
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('no dispara SELECT_EVENT ni avanza de paso mientras no se elige ningún evento', async () => {
    // Given: el catálogo tiene eventos, ninguno elegido
    vi.mocked(getEvents).mockResolvedValue(eventos)
    renderStep()

    // When: no se hace ninguna selección
    // Then: la slice sigue en el Paso 1 sin ningún evento
    expect(
      await screen.findByText(
        'currentStep: step-1-select-event — selectedEvent: ninguno',
      ),
    ).toBeInTheDocument()
  })

  it('al elegir un evento y pulsar Next, guarda el evento y avanza al Paso 2', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getEvents).mockResolvedValue(eventos)
    const usuario = userEvent.setup()
    renderStep()
    const card = await screen.findByRole('button', { name: /Cine Bajo Las Estrellas/ })

    // When: el usuario elige un evento y pulsa Next
    await usuario.click(card)
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: la slice guarda ese evento y avanza al Paso 2 (SpecPurchase 2.1)
    expect(
      screen.getByText(
        'currentStep: step-2-your-details — selectedEvent: Cine Bajo Las Estrellas',
      ),
    ).toBeInTheDocument()
  })
})
