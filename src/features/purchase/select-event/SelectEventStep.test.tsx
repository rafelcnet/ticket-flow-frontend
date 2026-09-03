import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePurchase } from '../../../hooks/usePurchase'
import { getPaginatedEvents } from '../../../services/events.service'
import { PurchaseProvider } from '../../../state/purchase/purchase.context'
import { SelectEventStep } from './SelectEventStep'

vi.mock('../../../services/events.service')

const PurchaseStateProbe = () => {
  const { state } = usePurchase()
  return (
    <p>
      currentStep: {state.currentStep} — selectedEvent: {state.selectedEvent?.name ?? 'ninguno'}
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

const badLiebre = {
  id: 'evt-001',
  venueId: 'ven-001',
  name: 'Bad Liebre',
  date: '2025-02-15',
  time: '21:00',
  location: 'Ciudad de México, México',
  imageUrl: 'https://example.com/bad-liebre.png',
  basePrice: 150,
  currency: 'USD' as const,
}

const cineBajoLasEstrellas = {
  id: 'evt-002',
  venueId: 'ven-002',
  name: 'Cine Bajo Las Estrellas',
  date: '2025-03-01',
  time: '19:30',
  location: 'Guadalajara, México',
  imageUrl: 'https://example.com/cine.png',
  basePrice: 75,
  currency: 'USD' as const,
}

const draftFunk = {
  id: 'evt-006',
  venueId: 'ven-001',
  name: 'Draft Funk',
  date: '2025-07-26',
  time: '20:30',
  location: 'Ciudad de México, México',
  imageUrl: 'https://example.com/draft-funk.png',
  basePrice: 115,
  currency: 'USD' as const,
}

const paginaUno = {
  data: [badLiebre, cineBajoLasEstrellas],
  pagination: { page: 1, limit: 6, total: 20, totalPages: 4 },
}

const paginaDos = {
  data: [draftFunk],
  pagination: { page: 2, limit: 6, total: 20, totalPages: 4 },
}

describe('SelectEventStep', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('pide la página 1 con 6 eventos por página al montar, y muestra un estado de carga mientras tanto (FIX-1)', () => {
    // Given: la petición del catálogo está en curso
    vi.mocked(getPaginatedEvents).mockReturnValue(new Promise(() => {}))

    // When: se monta el paso
    renderStep()

    // Then: se llama al servicio paginado con page=1, limit=6 y se muestra un estado de carga
    expect(getPaginatedEvents).toHaveBeenCalledWith(1, 6)
    expect(screen.getByText('Cargando eventos…')).toBeInTheDocument()
  })

  it('muestra nombre, fecha, ubicación y precio de cada evento (Context.md 5.4 Paso 1)', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)

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
    vi.mocked(getPaginatedEvents).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
    })

    // When: se monta el paso
    renderStep()

    // Then: se informa que no hay eventos
    expect(
      await screen.findByText('No hay eventos disponibles por ahora.'),
    ).toBeInTheDocument()
  })

  it('carga las imágenes de forma perezosa (Context.md 10, NFR de performance)', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)

    // When: se monta el paso
    renderStep()

    // Then: las imágenes usan loading="lazy"
    const imagen = await screen.findByAltText('Bad Liebre')
    expect(imagen).toHaveAttribute('loading', 'lazy')
  })

  it('mantiene el botón Next deshabilitado hasta elegir un evento', async () => {
    // Given: el catálogo tiene eventos, pero ninguno elegido todavía
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)
    renderStep()
    await screen.findByText('Bad Liebre')

    // When / Then: el botón sigue deshabilitado
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('resalta la card elegida al hacer click y habilita el botón Next', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)
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
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)
    renderStep()

    // When: no se hace ninguna selección
    // Then: la slice sigue en el Paso 1 sin ningún evento
    expect(
      await screen.findByText('currentStep: step-1-select-event — selectedEvent: ninguno'),
    ).toBeInTheDocument()
  })

  it('al elegir un evento y pulsar Next, guarda el evento y avanza al Paso 2', async () => {
    // Given: el catálogo tiene eventos disponibles
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)
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

  it('muestra la barra de paginación cuando hay más de una página (FIX-1)', async () => {
    // Given: el catálogo tiene más eventos de los que caben en una página
    vi.mocked(getPaginatedEvents).mockResolvedValue(paginaUno)

    // When: se monta el paso
    renderStep()

    // Then: se ven los controles de paginación
    expect(await screen.findByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
  })

  it('no muestra la barra de paginación si hay una sola página', async () => {
    // Given: el catálogo completo cabe en una sola página
    vi.mocked(getPaginatedEvents).mockResolvedValue({
      data: [badLiebre],
      pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
    })

    // When: se monta el paso
    renderStep()

    // Then: no hay controles de paginación que navegar
    await screen.findByText('Bad Liebre')
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })

  it('al cambiar de página, pide esa página con el mismo límite de 6 (AC: paginación como /bookings)', async () => {
    // Given: la primera página ya cargó
    vi.mocked(getPaginatedEvents).mockResolvedValueOnce(paginaUno)
    vi.mocked(getPaginatedEvents).mockResolvedValueOnce(paginaDos)
    const usuario = userEvent.setup()
    renderStep()
    await screen.findByText('Bad Liebre')

    // When: el usuario pulsa Next en la paginación
    await usuario.click(screen.getByRole('button', { name: 'Next page' }))

    // Then: se pide la página 2 con el mismo límite
    expect(getPaginatedEvents).toHaveBeenCalledWith(2, 6)
    expect(await screen.findByText('Draft Funk')).toBeInTheDocument()
  })

  it('conserva la grilla anterior visible mientras carga la siguiente página, sin parpadeo (decisión de FIX-1)', async () => {
    // Given: la primera página ya cargó
    vi.mocked(getPaginatedEvents).mockResolvedValueOnce(paginaUno)
    let resolverPaginaDos: (value: typeof paginaDos) => void = () => {}
    vi.mocked(getPaginatedEvents).mockReturnValueOnce(
      new Promise((resolve) => {
        resolverPaginaDos = resolve
      }),
    )
    const usuario = userEvent.setup()
    renderStep()
    await screen.findByText('Bad Liebre')

    // When: el usuario pulsa Next, mientras la página 2 todavía no responde
    await usuario.click(screen.getByRole('button', { name: 'Next page' }))

    // Then: la página 1 sigue visible — no aparece el estado de carga de golpe
    expect(screen.getByText('Bad Liebre')).toBeInTheDocument()

    // Cleanup: se resuelve la petición pendiente
    resolverPaginaDos(paginaDos)
    await screen.findByText('Draft Funk')
  })

  it('conserva la selección hecha en una página al avanzar a otra, y Next sigue funcionando (fix del bug de FIX-1)', async () => {
    // Given: el usuario elige un evento en la página 1
    vi.mocked(getPaginatedEvents).mockResolvedValueOnce(paginaUno)
    vi.mocked(getPaginatedEvents).mockResolvedValueOnce(paginaDos)
    const usuario = userEvent.setup()
    renderStep()
    const card = await screen.findByRole('button', { name: /Bad Liebre/ })
    await usuario.click(card)
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    // When: navega a la página 2, donde ese evento ya no aparece en la grilla
    await usuario.click(screen.getByRole('button', { name: 'Next page' }))
    await screen.findByText('Draft Funk')
    expect(screen.queryByText('Bad Liebre')).not.toBeInTheDocument()

    // Then: Next sigue habilitado y, al pulsarlo, avanza con el evento elegido en la página 1
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    await usuario.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      screen.getByText('currentStep: step-2-your-details — selectedEvent: Bad Liebre'),
    ).toBeInTheDocument()
  })
})
