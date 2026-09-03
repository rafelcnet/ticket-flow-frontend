import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../http/http.types'
import { cancelBooking, listBookings } from '../../services/bookings.service'
import { BookingsPage } from './BookingsPage'

vi.mock('../../services/bookings.service')

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

const respuestaConUnaReserva = {
  data: [bookingConfirmado],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
}

const respuestaVacia = {
  data: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
}

const renderBookingsPage = (initialEntry = '/bookings') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/buy" element={<p>Purchase flow</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('BookingsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('muestra el encabezado de la pantalla de mis reservas', () => {
    // Given: la pantalla 4 del mapa de pantallas (Context.md 5.5)
    vi.mocked(listBookings).mockReturnValue(new Promise(() => {}))

    // When: se renderiza la pantalla
    renderBookingsPage()

    // Then: el usuario ve el título que identifica la pantalla
    expect(screen.getByRole('heading', { level: 1, name: 'My Bookings' })).toBeInTheDocument()
  })

  it('pide GET /bookings al entrar a la pantalla y muestra un estado de carga mientras tanto', () => {
    // Given: la petición está en curso
    vi.mocked(listBookings).mockReturnValue(new Promise(() => {}))

    // When: se monta la pantalla
    renderBookingsPage()

    // Then: se llama al servicio y se muestra un estado de carga
    expect(listBookings).toHaveBeenCalledWith({ page: 1, limit: 10 })
    expect(screen.getByText('Cargando reservas…')).toBeInTheDocument()
  })

  it('muestra evento, fecha, asiento, total y status de cada reserva (AC: veo mi información principal)', async () => {
    // Given: el backend devuelve una reserva
    vi.mocked(listBookings).mockResolvedValue(respuestaConUnaReserva)

    // When: se monta la pantalla
    renderBookingsPage()

    // Then: la fila con la información principal es visible
    expect(await screen.findByText('TF-001')).toBeInTheDocument()
    expect(screen.getByText('Bad Liebre')).toBeInTheDocument()
    expect(screen.getByText('Fila 1, Columna 1 — VIP')).toBeInTheDocument()
    expect(screen.getByText('$150.00 USD')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Confirmed')).toBeInTheDocument()
  })

  it('muestra un error si la carga falla', async () => {
    // Given: el backend falla
    vi.mocked(listBookings).mockRejectedValue(new Error('network error'))

    // When: se monta la pantalla
    renderBookingsPage()

    // Then: se informa el error
    expect(await screen.findByText('No pudimos cargar tus reservas.')).toBeInTheDocument()
  })

  it('muestra el estado vacío con el CTA cuando no hay ninguna reserva (AC: aún no tengo reservas)', async () => {
    // Given: el usuario no tiene ninguna reserva
    vi.mocked(listBookings).mockResolvedValue(respuestaVacia)
    const usuario = userEvent.setup()

    // When: se monta la pantalla
    renderBookingsPage()

    // Then: se ve el mensaje y el CTA (Context.md 5.5, SpecBookings 3)
    expect(await screen.findByText('Aún no tienes reservaciones')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: 'Buy your first ticket' })

    // When: el usuario pulsa el CTA
    await usuario.click(cta)

    // Then: navega al flujo de compra
    expect(await screen.findByText('Purchase flow')).toBeInTheDocument()
  })

  it('filtra por status de inmediato y reinicia a la página 1 (AC: filtrar por evento/estado/fechas)', async () => {
    // Given: la primera carga ya resolvió
    vi.mocked(listBookings).mockResolvedValue(respuestaConUnaReserva)
    const usuario = userEvent.setup()
    renderBookingsPage('/bookings?page=2')
    await screen.findByText('TF-001')
    vi.mocked(listBookings).mockClear()

    // When: el usuario filtra por status
    await usuario.selectOptions(screen.getByLabelText('Status'), 'confirmed')

    // Then: se vuelve a pedir la lista con ese filtro, reiniciando a la página 1
    expect(listBookings).toHaveBeenCalledWith({ status: 'confirmed', page: 1, limit: 10 })
  })

  it('al limpiar un filtro (ej. volver a "Todos los estados"), lo quita de la siguiente consulta', async () => {
    // Given: la pantalla ya cargó con el filtro status=confirmed activo
    vi.mocked(listBookings).mockResolvedValue(respuestaConUnaReserva)
    renderBookingsPage('/bookings?status=confirmed')
    await screen.findByText('TF-001')
    vi.mocked(listBookings).mockClear()

    // When: el usuario vuelve a "Todos los estados"
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: '' } })

    // Then: la siguiente consulta ya no incluye ese filtro
    await waitFor(() => expect(listBookings).toHaveBeenCalledWith({ page: 1, limit: 10 }))
  })

  it('pide la página siguiente al pulsar Next en la paginación (AC: navegar por páginas)', async () => {
    // Given: hay más de una página de resultados
    vi.mocked(listBookings).mockResolvedValue({
      data: [bookingConfirmado],
      pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
    })
    const usuario = userEvent.setup()
    renderBookingsPage()
    await screen.findByText('TF-001')
    vi.mocked(listBookings).mockClear()

    // When: el usuario pulsa Next
    await usuario.click(screen.getByRole('button', { name: 'Next' }))

    // Then: se pide la página 2
    expect(listBookings).toHaveBeenCalledWith({ page: 2, limit: 10 })
  })

  it('al cancelar, actualiza la fila de inmediato con un patch local — sin refetch (AC: veo el cambio reflejado)', async () => {
    // Given: una reserva confirmada, cancelable
    vi.mocked(listBookings).mockResolvedValue(respuestaConUnaReserva)
    vi.mocked(cancelBooking).mockResolvedValue({
      id: 'TF-001',
      status: 'cancelled',
      cancelledAt: '2026-07-04T16:00:00.000Z',
    })
    const usuario = userEvent.setup()
    renderBookingsPage()
    await screen.findByText('TF-001')

    // When: pulsa Cancelar y confirma en el modal
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByText('¿Seguro que quieres cancelar esta reservación?'),
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    // Then: se llama a PATCH /bookings/:id/cancel y la fila se actualiza de inmediato
    expect(cancelBooking).toHaveBeenCalledWith('TF-001')
    expect(
      await within(screen.getByRole('table')).findByText('Cancelled'),
    ).toBeInTheDocument()
    // Y no hubo un refetch completo — sólo la carga inicial
    expect(listBookings).toHaveBeenCalledTimes(1)
  })

  it('no cancela nada si el usuario cierra el modal sin confirmar (CANCEL_DISMISS)', async () => {
    // Given: una reserva confirmada
    vi.mocked(listBookings).mockResolvedValue(respuestaConUnaReserva)
    const usuario = userEvent.setup()
    renderBookingsPage()
    await screen.findByText('TF-001')

    // When: abre el modal y lo cierra sin confirmar
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await usuario.click(screen.getByRole('button', { name: 'No, mantener' }))

    // Then: no se llama al backend y la reserva sigue confirmada
    expect(cancelBooking).not.toHaveBeenCalled()
    expect(within(screen.getByRole('table')).getByText('Confirmed')).toBeInTheDocument()
  })

  it('sólo permite cancelar reservas confirmed o pending (AC: sólo puedo cancelar confirmadas o pendientes)', async () => {
    // Given: una reserva ya cancelada
    vi.mocked(listBookings).mockResolvedValue({
      data: [{ ...bookingConfirmado, status: 'cancelled' as const }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    })
    renderBookingsPage()

    // When / Then: no hay ningún botón Cancelar disponible
    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('ante 409 INVALID_TRANSITION al cancelar, revalida en vez de aplicar el patch (SpecBookings 6.3)', async () => {
    // Given: la copia local está desactualizada — el servidor dice que ya estaba cancelada
    vi.mocked(listBookings)
      .mockResolvedValueOnce(respuestaConUnaReserva)
      .mockResolvedValueOnce({
        data: [{ ...bookingConfirmado, status: 'cancelled' as const }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      })
    vi.mocked(cancelBooking).mockRejectedValue(
      new ApiError(409, {
        error: 'INVALID_TRANSITION',
        message: 'This booking cannot be cancelled in its current state',
      }),
    )
    const usuario = userEvent.setup()
    renderBookingsPage()
    await screen.findByText('TF-001')

    // When: intenta cancelar de todas formas
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    // Then: se revalida (segunda llamada a GET /bookings), no un patch local ciego
    const tabla = await screen.findByRole('table')
    expect(within(tabla).getByText('Cancelled')).toBeInTheDocument()
    expect(listBookings).toHaveBeenCalledTimes(2)
  })

  it('ante 404 BOOKING_NOT_FOUND al cancelar, revalida la página completa (SpecBookings 6.4)', async () => {
    // Given: el booking ya no existe en el backend (reinicio del contenedor, Context.md 3.1)
    vi.mocked(listBookings)
      .mockResolvedValueOnce(respuestaConUnaReserva)
      .mockResolvedValueOnce(respuestaVacia)
    vi.mocked(cancelBooking).mockRejectedValue(
      new ApiError(404, { error: 'BOOKING_NOT_FOUND', message: 'Booking not found' }),
    )
    const usuario = userEvent.setup()
    renderBookingsPage()
    await screen.findByText('TF-001')

    // When: intenta cancelar de todas formas
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await usuario.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    // Then: se revalida y la página queda vacía, tal como confirma el servidor
    expect(await screen.findByText('Aún no tienes reservaciones')).toBeInTheDocument()
    expect(listBookings).toHaveBeenCalledTimes(2)
  })
})
