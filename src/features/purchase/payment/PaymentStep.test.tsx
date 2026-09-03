import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePurchase } from '../../../hooks/usePurchase'
import { useSeatMap } from '../../../hooks/useSeatMap'
import { ApiError } from '../../../http/http.types'
import { createBooking } from '../../../services/bookings.service'
import { processPayment } from '../../../services/payment.service'
import { PurchaseProvider } from '../../../state/purchase/purchase.context'
import { SeatMapProvider } from '../../../state/seat-map/seat-map.context'
import { PaymentStep } from './PaymentStep'

vi.mock('../../../services/payment.service')
vi.mock('../../../services/bookings.service')

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

const asientoResuelto = {
  seatId: 'sea-002',
  row: 1,
  col: 2,
  zoneName: 'VIP',
  zonePrice: 150,
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
  seatId: 'sea-002',
  row: 1,
  col: 2,
  zone: 'VIP',
}

const PurchaseStateProbe = () => {
  const { state } = usePurchase()
  return (
    <p>
      currentStep: {state.currentStep} — paymentResult:{' '}
      {state.paymentResult?.transactionId ?? 'ninguno'} — selectedSeat:{' '}
      {state.selectedSeat?.seatId ?? 'ninguno'}
    </p>
  )
}

const SeatMapStateProbe = () => {
  const { state } = useSeatMap()
  return <p>seatMapStatus: {state.status}</p>
}

/** Avanza la slice `purchase` hasta el Paso 4, con evento/datos/asiento ya elegidos. */
const SeedUntilStep4 = () => {
  const { dispatch } = usePurchase()
  return (
    <button
      onClick={() => {
        dispatch({ type: 'SELECT_EVENT', payload: { event: evento } })
        dispatch({ type: 'CONFIRM_DETAILS', payload: { contactDetails: datosDeContacto } })
        dispatch({ type: 'SELECT_SEAT', payload: { seat: asientoResuelto } })
      }}
    >
      seed-hasta-paso-4
    </button>
  )
}

const renderPaymentStep = () =>
  render(
    <MemoryRouter initialEntries={['/buy']}>
      <PurchaseProvider>
        <SeatMapProvider>
          <SeedUntilStep4 />
          <PaymentStep />
          <PurchaseStateProbe />
          <SeatMapStateProbe />
        </SeatMapProvider>
      </PurchaseProvider>
      <Routes>
        <Route path="/bookings" element={<p>Mis reservaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )

const irAlPaso4 = async (usuario: ReturnType<typeof userEvent.setup>) => {
  renderPaymentStep()
  await usuario.click(screen.getByRole('button', { name: 'seed-hasta-paso-4' }))
}

const completarFormularioDeTarjeta = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.type(screen.getByLabelText('Card number'), '4111111111111111')
  await usuario.type(screen.getByLabelText('Expiration date'), '1228')
  await usuario.type(screen.getByLabelText('CVV'), '123')
  await usuario.type(screen.getByLabelText('Cardholder name'), 'Sofía Hernández')
}

describe('PaymentStep', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('muestra el resumen de la orden con el asiento ya resuelto (Context.md 5.4 Paso 4)', async () => {
    // Given: el usuario llegó al Paso 4 con un asiento VIP elegido
    const usuario = userEvent.setup()

    // When: se monta el paso
    await irAlPaso4(usuario)

    // Then: el resumen muestra evento, asiento, precio base, service fee y total (150 + 8)
    expect(screen.getByText('Bad Liebre')).toBeInTheDocument()
    expect(screen.getByText('2025-02-15 · 21:00')).toBeInTheDocument()
    expect(screen.getByText('Fila 1, Columna 2 — VIP')).toBeInTheDocument()
    expect(screen.getByText('Precio base: $150.00')).toBeInTheDocument()
    expect(screen.getByText('Service fee: $8.00')).toBeInTheDocument()
    expect(screen.getByText('Total: $158.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pay $158.00' })).toBeInTheDocument()
  })

  it('permite elegir entre tarjeta y PayPal (AC: elegir método de pago)', async () => {
    // Given: el formulario de tarjeta se muestra por defecto
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    expect(screen.getByLabelText('Card number')).toBeInTheDocument()

    // When: el usuario elige PayPal
    await usuario.click(screen.getByRole('button', { name: '🅿️ PayPal' }))

    // Then: el formulario de tarjeta desaparece y se explica la redirección simulada
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()
    expect(
      screen.getByText('Serás redirigido a PayPal para completar el pago.'),
    ).toBeInTheDocument()
  })

  it('no envía el pago si los datos de la tarjeta están incompletos (AC: no puedo enviar el pago incompleto)', async () => {
    // Given: el usuario está en el Paso 4 con el método tarjeta, sin llenar nada
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)

    // When: intenta pagar sin completar el formulario
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: se muestran los errores de validación y no se llama al backend
    expect(
      await screen.findByText('El número de tarjeta debe tener 16 dígitos'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La fecha de expiración debe tener el formato MM/YY'),
    ).toBeInTheDocument()
    expect(screen.getByText('El CVV debe tener 3 dígitos')).toBeInTheDocument()
    expect(screen.getByText('El nombre del titular es obligatorio')).toBeInTheDocument()
    expect(processPayment).not.toHaveBeenCalled()
  })

  it('autoformatea los campos de tarjeta mientras el usuario escribe (Context.md 5.4)', async () => {
    // Given: el formulario de tarjeta vacío
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)

    // When: el usuario escribe los campos sin ningún separador
    await completarFormularioDeTarjeta(usuario)

    // Then: cada campo queda autoformateado
    expect(screen.getByLabelText('Card number')).toHaveValue('4111 1111 1111 1111')
    expect(screen.getByLabelText('Expiration date')).toHaveValue('12/28')
    expect(screen.getByLabelText('CVV')).toHaveValue('123')
  })

  it('muestra que está procesando mientras espera el pago y la reserva (AC: veo que está trabajando)', async () => {
    // Given: el pago tarda en resolver
    let resolverPago: (value: typeof respuestaPagoAprobado) => void = () => {}
    vi.mocked(processPayment).mockReturnValue(
      new Promise((resolve) => {
        resolverPago = resolve
      }),
    )
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: envía el pago
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: el botón queda deshabilitado y muestra el estado de envío
    expect(screen.getByRole('button', { name: 'Procesando pago…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()

    // Cleanup: se resuelve el pago para no dejar una promesa pendiente
    resolverPago(respuestaPagoAprobado)
    await screen.findByText('¡Reservación confirmada!')
  })

  it('si el pago es aprobado, crea la reserva y muestra la confirmación con los detalles (AC: veo la confirmación)', async () => {
    // Given: el pago y la creación de la reserva se aprueban
    vi.mocked(processPayment).mockResolvedValue(respuestaPagoAprobado)
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: envía el pago
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: se llama al pago sólo con el método (SpecHttp 6/7.7 — nunca los datos de tarjeta)
    expect(processPayment).toHaveBeenCalledWith({ method: 'card' })

    // Y se crea la reserva reenviando el transactionId como Idempotency Key (SpecPurchase 4.2/4.4)
    expect(createBooking).toHaveBeenCalledWith({
      eventId: 'evt-001',
      seatId: 'sea-002',
      contactEmail: 'sofia.hernandez@ticketflow.com',
      contactPhone: '+525511223344',
      payment: { method: 'card', transactionId: 'txn-583921' },
      total: 158,
    })

    // Y se muestra la Confirmation con el booking ID
    expect(await screen.findByText('¡Reservación confirmada!')).toBeInTheDocument()
    expect(screen.getByText('TF-583921')).toBeInTheDocument()
    expect(screen.getByText('currentStep: step-5-confirmation', { exact: false })).toBeInTheDocument()
  })

  it('"Buy another" desde la Confirmation reinicia la slice al Paso 1 (SpecState 3.4)', async () => {
    // Given: el usuario ya completó una compra y ve la Confirmation
    vi.mocked(processPayment).mockResolvedValue(respuestaPagoAprobado)
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))
    await screen.findByText('¡Reservación confirmada!')

    // When: pulsa "Buy another"
    await usuario.click(screen.getByRole('button', { name: 'Buy another' }))

    // Then: la slice purchase reinicia al Paso 1 (BUY_ANOTHER)
    expect(
      await screen.findByText('currentStep: step-1-select-event', { exact: false }),
    ).toBeInTheDocument()
  })

  it('ante un error no fijado por el Spec (ej. 500), reactiva el botón sin mostrar el mensaje de rechazo', async () => {
    // Given: el backend responde con un error genérico (SpecHttp 4.2: sin copia específica)
    vi.mocked(processPayment).mockRejectedValue(
      new ApiError(500, {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      }),
    )
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: envía el pago
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: el botón se reactiva para reintentar, sin el mensaje de rechazo (eso es sólo para 402)
    expect(await screen.findByRole('button', { name: 'Pay $158.00' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(createBooking).not.toHaveBeenCalled()
  })

  it('paga con PayPal sin pedir datos de tarjeta (Context.md 5.4: "shows simulated redirect button")', async () => {
    // Given: el pago y la reserva se aprueban
    vi.mocked(processPayment).mockResolvedValue(respuestaPagoAprobado)
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)

    // When: elige PayPal y paga sin llenar ningún campo
    await usuario.click(screen.getByRole('button', { name: '🅿️ PayPal' }))
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: se paga con el método paypal, sin errores de validación
    expect(await screen.findByText('¡Reservación confirmada!')).toBeInTheDocument()
    expect(processPayment).toHaveBeenCalledWith({ method: 'paypal' })
  })

  it('si el pago es rechazado, muestra el motivo, reactiva el botón y conserva los datos (AC: reintentar sin perder mis datos)', async () => {
    // Given: el backend rechaza el pago (10% de los casos, SpecHttp 5.1/7.7)
    vi.mocked(processPayment).mockRejectedValueOnce(
      new ApiError(402, {
        error: 'PAYMENT_DECLINED',
        message: 'Your payment was declined. Please try again.',
      }),
    )
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: envía el pago y es rechazado
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: se muestra el motivo del rechazo devuelto por el backend
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your payment was declined. Please try again.',
    )
    // Y no se crea ninguna reserva
    expect(createBooking).not.toHaveBeenCalled()
    // Y los datos ya escritos no se pierden
    expect(screen.getByLabelText('Card number')).toHaveValue('4111 1111 1111 1111')
    // Y el botón vuelve a estar habilitado para reintentar
    expect(screen.getByRole('button', { name: 'Pay $158.00' })).toBeEnabled()
  })

  it('al reintentar después de un rechazo y ser aprobado, sólo crea una reserva (AC: no cobrar dos veces)', async () => {
    // Given: el primer intento es rechazado, el segundo es aprobado
    vi.mocked(processPayment)
      .mockRejectedValueOnce(
        new ApiError(402, {
          error: 'PAYMENT_DECLINED',
          message: 'Your payment was declined. Please try again.',
        }),
      )
      .mockResolvedValueOnce(respuestaPagoAprobado)
    vi.mocked(createBooking).mockResolvedValue(reservaCreada)
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: paga, es rechazado, y reintenta
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))
    await screen.findByRole('alert')
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: cada intento llamó una vez a processPayment, pero sólo se creó una reserva
    await screen.findByText('¡Reservación confirmada!')
    expect(processPayment).toHaveBeenCalledTimes(2)
    expect(createBooking).toHaveBeenCalledTimes(1)
  })

  it('si el asiento se pierde mientras se crea la reserva, revalida seatMap y vuelve al Paso 3 (SpecPurchase 2.2, SpecSeatMap 4.5)', async () => {
    // Given: el pago se aprueba, pero al crear la reserva el asiento ya no está disponible
    vi.mocked(processPayment).mockResolvedValue(respuestaPagoAprobado)
    vi.mocked(createBooking).mockRejectedValue(
      new ApiError(409, {
        error: 'SEAT_UNAVAILABLE',
        message: 'The selected seat is not available',
      }),
    )
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)
    await completarFormularioDeTarjeta(usuario)

    // When: envía el pago
    await usuario.click(screen.getByRole('button', { name: 'Pay $158.00' }))

    // Then: vuelve al Paso 3, descartando el asiento y el pago obsoletos
    expect(
      await screen.findByText('currentStep: step-3-select-seat', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByText('selectedSeat: ninguno', { exact: false })).toBeInTheDocument()
    // Y la slice seatMap vuelve a loading para revalidar el mapa (GET /events/:id/seats otra vez)
    expect(screen.getByText('seatMapStatus: loading')).toBeInTheDocument()
  })

  it('el botón Back dispatcha GO_BACK sin perder los datos ya confirmados', async () => {
    // Given: el usuario está en el Paso 4
    const usuario = userEvent.setup()
    await irAlPaso4(usuario)

    // When: pulsa Back
    await usuario.click(screen.getByRole('button', { name: 'Back' }))

    // Then: la slice vuelve al Paso 3 (SpecPurchase 2.1)
    expect(
      await screen.findByText('currentStep: step-3-select-seat', { exact: false }),
    ).toBeInTheDocument()
  })
})
