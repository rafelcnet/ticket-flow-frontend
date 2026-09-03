import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingsProvider } from '../state/bookings/bookings.context'
import { useBookings } from './useBookings'

const ConsumerFueraDeProvider = () => {
  useBookings()
  return null
}

const ConsumerDentroDeProvider = () => {
  const { state } = useBookings()
  return <p>status: {state.status}</p>
}

describe('useBookings', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lanza un error si se usa fuera de un BookingsProvider', () => {
    // Given: un componente que llama a useBookings sin ningún BookingsProvider como ancestro
    // When / Then: el render falla con un mensaje claro
    expect(() => render(<ConsumerFueraDeProvider />)).toThrow(
      'useBookings debe usarse dentro de un BookingsProvider',
    )
  })

  it('devuelve el estado y el dispatch de la slice bookings cuando sí hay un BookingsProvider', () => {
    // Given: el componente está dentro de un BookingsProvider
    // When: se renderiza
    render(
      <BookingsProvider>
        <ConsumerDentroDeProvider />
      </BookingsProvider>,
    )

    // Then: obtiene el estado inicial de la slice, sin lanzar ningún error
    expect(screen.getByText('status: idle')).toBeInTheDocument()
  })
})
