import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SeatMapProvider } from '../state/seat-map/seat-map.context'
import { useSeatMap } from './useSeatMap'

const ConsumerFueraDeProvider = () => {
  useSeatMap()
  return null
}

const ConsumerDentroDeProvider = () => {
  const { state } = useSeatMap()
  return <p>status: {state.status}</p>
}

describe('useSeatMap', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lanza un error si se usa fuera de un SeatMapProvider', () => {
    // Given: un componente que llama a useSeatMap sin ningún SeatMapProvider como ancestro
    // When / Then: el render falla con un mensaje claro
    expect(() => render(<ConsumerFueraDeProvider />)).toThrow(
      'useSeatMap debe usarse dentro de un SeatMapProvider',
    )
  })

  it('devuelve el estado y el dispatch de la slice seatMap cuando sí hay un SeatMapProvider', () => {
    // Given: el componente está dentro de un SeatMapProvider
    // When: se renderiza
    render(
      <SeatMapProvider>
        <ConsumerDentroDeProvider />
      </SeatMapProvider>,
    )

    // Then: obtiene el estado inicial de la slice, sin lanzar ningún error
    expect(screen.getByText('status: idle')).toBeInTheDocument()
  })
})
