import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePurchase } from '../../../hooks/usePurchase'
import { ApiError } from '../../../http/http.types'
import { getSeatMap } from '../../../services/seats.service'
import { PurchaseProvider } from '../../../state/purchase/purchase.context'
import { SeatMapProvider } from '../../../state/seat-map/seat-map.context'
import { SelectSeatStep } from './SelectSeatStep'

vi.mock('../../../services/seats.service')

const evento = {
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

const datosDeContacto = {
  firstName: 'Sofía',
  lastName: 'Hernández',
  email: 'sofia.hernandez@ticketflow.com',
  phone: '+525511223344',
}

const seatMapFlatResponse = {
  eventId: 'evt-001',
  venueType: 'flat' as const,
  zones: [
    { id: 'zon-001', name: 'VIP', color: '#e94560', price: 150 },
    { id: 'zon-002', name: 'Premium', color: '#f0a500', price: 110 },
  ],
  seats: [
    { seatId: 'sea-001', row: 1, col: 1, zone: 'zon-001', status: 'occupied' as const },
    { seatId: 'sea-002', row: 1, col: 2, zone: 'zon-002', status: 'available' as const },
  ],
}

const PurchaseStateProbe = () => {
  const { state } = usePurchase()
  return (
    <p>
      currentStep: {state.currentStep} — selectedSeat:{' '}
      {state.selectedSeat
        ? `${state.selectedSeat.seatId} (${state.selectedSeat.zoneName} $${state.selectedSeat.zonePrice})`
        : 'ninguno'}
    </p>
  )
}

/** Avanza la slice `purchase` hasta el Paso 3 con un evento y datos de contacto ya confirmados. */
const SeedUntilStep3 = () => {
  const { dispatch } = usePurchase()
  return (
    <button
      onClick={() => {
        dispatch({ type: 'SELECT_EVENT', payload: { event: evento } })
        dispatch({ type: 'CONFIRM_DETAILS', payload: { contactDetails: datosDeContacto } })
      }}
    >
      seed-hasta-paso-3
    </button>
  )
}

const renderStep = () =>
  render(
    <PurchaseProvider>
      <SeatMapProvider>
        <SeedUntilStep3 />
        <SelectSeatStep />
        <PurchaseStateProbe />
      </SeatMapProvider>
    </PurchaseProvider>,
  )

describe('SelectSeatStep', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('no pide el mapa de asientos mientras no haya un evento seleccionado', () => {
    // Given: la slice purchase todavía no tiene selectedEvent
    // When: se monta el paso
    renderStep()

    // Then: no se llama al servicio y se muestra el estado de carga
    expect(getSeatMap).not.toHaveBeenCalled()
    expect(screen.getByText('Cargando mapa de asientos…')).toBeInTheDocument()
  })

  it('al haber un evento seleccionado, pide GET /events/:id/seats y muestra carga mientras tanto', async () => {
    // Given: la petición está en curso
    vi.mocked(getSeatMap).mockReturnValue(new Promise(() => {}))
    const usuario = userEvent.setup()
    renderStep()

    // When: se selecciona el evento (llega al Paso 3)
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))

    // Then: se pide el mapa de asientos de ese evento
    expect(getSeatMap).toHaveBeenCalledWith('evt-001')
    expect(screen.getByText('Cargando mapa de asientos…')).toBeInTheDocument()
  })

  it('renderiza el layout correspondiente al venueType y la leyenda de zonas (Context.md 5.4)', async () => {
    // Given: el backend responde con un venue flat
    vi.mocked(getSeatMap).mockResolvedValue(seatMapFlatResponse)
    const usuario = userEvent.setup()
    renderStep()

    // When: se llega al Paso 3
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))

    // Then: se ve un asiento por cada seat y la leyenda de zonas (VIP/Premium)
    expect(await screen.findAllByRole('button', { name: /Fila \d, columna \d/ })).toHaveLength(2)
    expect(screen.getByText('VIP — $150.00')).toBeInTheDocument()
    expect(screen.getByText('Premium — $110.00')).toBeInTheDocument()
  })

  it('mantiene Next deshabilitado hasta elegir un asiento available', async () => {
    // Given: el mapa de asientos ya cargado
    vi.mocked(getSeatMap).mockResolvedValue(seatMapFlatResponse)
    const usuario = userEvent.setup()
    renderStep()
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))
    await screen.findByText('VIP — $150.00')

    // When / Then: Next sigue deshabilitado sin selección
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('al elegir un asiento y pulsar Next, resuelve su zona y avanza al Paso 4 (SpecPurchase 4.3)', async () => {
    // Given: el mapa de asientos ya cargado
    vi.mocked(getSeatMap).mockResolvedValue(seatMapFlatResponse)
    const usuario = userEvent.setup()
    renderStep()
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))
    await screen.findByText('VIP — $150.00')

    // When: elige el asiento available (zona Premium) y pulsa Next
    await usuario.click(screen.getByRole('button', { name: 'Fila 1, columna 2' }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: la slice purchase guarda el asiento con la zona ya resuelta y avanza
    expect(
      screen.getByText('currentStep: step-4-payment — selectedSeat: sea-002 (Premium $110)'),
    ).toBeInTheDocument()
  })

  it('permite deseleccionar un asiento antes de continuar (Context.md 5.4: cambiar de opinión)', async () => {
    // Given: un asiento ya elegido
    vi.mocked(getSeatMap).mockResolvedValue(seatMapFlatResponse)
    const usuario = userEvent.setup()
    renderStep()
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))
    const asiento = await screen.findByRole('button', { name: 'Fila 1, columna 2' })
    await usuario.click(asiento)
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    // When: hace click de nuevo sobre el mismo asiento
    await usuario.click(asiento)

    // Then: la selección se limpia y Next vuelve a deshabilitarse
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('el botón Back dispatcha GO_BACK sin perder los datos ya confirmados', async () => {
    // Given: el mapa de asientos ya cargado en el Paso 3
    vi.mocked(getSeatMap).mockResolvedValue(seatMapFlatResponse)
    const usuario = userEvent.setup()
    renderStep()
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))
    await screen.findByText('VIP — $150.00')

    // When: pulsa Back
    await usuario.click(screen.getByRole('button', { name: 'Back' }))

    // Then: la slice vuelve al Paso 2 (SpecPurchase 2.1)
    expect(screen.getByText(/currentStep: step-2-your-details/)).toBeInTheDocument()
  })

  it('muestra un error y permite reintentar ante EVENT_NOT_FOUND (SpecSeatMap 4.4)', async () => {
    // Given: el evento ya no existe
    const error = new ApiError(404, { error: 'EVENT_NOT_FOUND', message: 'Event not found' })
    vi.mocked(getSeatMap).mockRejectedValueOnce(error)
    const usuario = userEvent.setup()
    renderStep()

    // When: se llega al Paso 3 y la carga falla
    await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-3' }))

    // Then: se muestra el error con opción de reintentar
    expect(await screen.findByText('No pudimos cargar el mapa de asientos.')).toBeInTheDocument()
    const boton = screen.getByRole('button', { name: 'Reintentar' })

    // When: reintenta y el segundo intento sí funciona
    vi.mocked(getSeatMap).mockResolvedValueOnce(seatMapFlatResponse)
    await usuario.click(boton)

    // Then: se vuelve a pedir el mapa y esta vez se renderiza
    expect(await screen.findByText('VIP — $150.00')).toBeInTheDocument()
    expect(getSeatMap).toHaveBeenCalledTimes(2)
  })
})
