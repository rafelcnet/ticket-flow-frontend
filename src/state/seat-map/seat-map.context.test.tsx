import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'
import { SeatMapContext, SeatMapProvider } from './seat-map.context'

/** Consumidor mínimo que expone el estado y permite despachar acciones. */
const Consumer = () => {
  const context = useContext(SeatMapContext)
  if (!context) return null
  const { state, dispatch } = context
  return (
    <div>
      <p>status: {state.status}</p>
      <button onClick={() => dispatch({ type: 'LOAD_SEAT_MAP' })}>cargar mapa</button>
    </div>
  )
}

describe('SeatMapProvider', () => {
  it('renderiza a sus hijos', () => {
    // Given / When: se monta el provider con contenido dentro
    render(
      <SeatMapProvider>
        <p>contenido hijo</p>
      </SeatMapProvider>,
    )

    // Then: el contenido se renderiza normalmente
    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })

  it('expone el estado inicial de la slice seatMap a sus consumidores', () => {
    // Given: todavía no se cargó ningún mapa de asientos
    // When: se monta el provider
    render(
      <SeatMapProvider>
        <Consumer />
      </SeatMapProvider>,
    )

    // Then: el consumidor ve el estado idle inicial (SpecState 4.1)
    expect(screen.getByText('status: idle')).toBeInTheDocument()
  })

  it('propaga las acciones despachadas por un consumidor a todo el árbol', async () => {
    // Given: un consumidor con acceso al dispatch de la slice
    const usuario = userEvent.setup()
    render(
      <SeatMapProvider>
        <Consumer />
      </SeatMapProvider>,
    )

    // When: despacha LOAD_SEAT_MAP
    await usuario.click(screen.getByRole('button', { name: 'cargar mapa' }))

    // Then: el nuevo estado se refleja de inmediato
    expect(screen.getByText('status: loading')).toBeInTheDocument()
  })
})
