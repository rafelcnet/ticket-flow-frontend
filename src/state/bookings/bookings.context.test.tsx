import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'
import { BookingsContext, BookingsProvider } from './bookings.context'

/** Consumidor mínimo que expone el estado y permite despachar acciones. */
const Consumer = () => {
  const context = useContext(BookingsContext)
  if (!context) return null
  const { state, dispatch } = context
  return (
    <div>
      <p>status: {state.status}</p>
      <button
        onClick={() =>
          dispatch({ type: 'LOAD_BOOKINGS', payload: { filters: {}, page: 1, limit: 10 } })
        }
      >
        cargar reservas
      </button>
    </div>
  )
}

describe('BookingsProvider', () => {
  it('renderiza a sus hijos', () => {
    // Given / When: se monta el provider con contenido dentro
    render(
      <BookingsProvider>
        <p>contenido hijo</p>
      </BookingsProvider>,
    )

    // Then: el contenido se renderiza normalmente
    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })

  it('expone el estado inicial de la slice bookings a sus consumidores', () => {
    // Given: todavía no se cargó ninguna reserva
    // When: se monta el provider
    render(
      <BookingsProvider>
        <Consumer />
      </BookingsProvider>,
    )

    // Then: el consumidor ve el estado idle inicial (SpecBookings 4.1)
    expect(screen.getByText('status: idle')).toBeInTheDocument()
  })

  it('propaga las acciones despachadas por un consumidor a todo el árbol', async () => {
    // Given: un consumidor con acceso al dispatch de la slice
    const usuario = userEvent.setup()
    render(
      <BookingsProvider>
        <Consumer />
      </BookingsProvider>,
    )

    // When: despacha LOAD_BOOKINGS
    await usuario.click(screen.getByRole('button', { name: 'cargar reservas' }))

    // Then: el nuevo estado se refleja de inmediato
    expect(screen.getByText('status: loading')).toBeInTheDocument()
  })
})
