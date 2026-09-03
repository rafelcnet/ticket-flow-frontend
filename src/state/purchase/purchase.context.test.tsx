import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'
import { PurchaseContext, PurchaseProvider } from './purchase.context'

const evento = {
  id: 'evt-001',
  venueId: 'ven-001',
  name: 'Bad Liebre',
  date: '2025-02-15',
  time: '21:00',
  location: 'Ciudad de México, México',
  imageUrl: 'https://raw.githubusercontent.com/.../bad-liebre.png',
  basePrice: 150,
  currency: 'USD' as const,
}

/** Consumidor mínimo que expone el estado y permite despachar acciones. */
const Consumer = () => {
  const context = useContext(PurchaseContext)
  if (!context) return null
  const { state, dispatch } = context
  return (
    <div>
      <p>currentStep: {state.currentStep}</p>
      <button
        onClick={() => dispatch({ type: 'SELECT_EVENT', payload: { event: evento } })}
      >
        seleccionar evento
      </button>
    </div>
  )
}

describe('PurchaseProvider', () => {
  it('renderiza a sus hijos', () => {
    // Given / When: se monta el provider con contenido dentro
    render(
      <PurchaseProvider>
        <p>contenido hijo</p>
      </PurchaseProvider>,
    )

    // Then: el contenido se renderiza normalmente
    expect(screen.getByText('contenido hijo')).toBeInTheDocument()
  })

  it('expone el estado inicial de la slice purchase a sus consumidores', () => {
    // Given: el usuario todavía no eligió ningún evento
    // When: se monta el provider
    render(
      <PurchaseProvider>
        <Consumer />
      </PurchaseProvider>,
    )

    // Then: el consumidor ve el Paso 1 como estado inicial
    expect(screen.getByText('currentStep: step-1-select-event')).toBeInTheDocument()
  })

  it('propaga las acciones despachadas por un consumidor a todo el árbol', async () => {
    // Given: un consumidor con acceso al dispatch de la slice
    const user = userEvent.setup()
    render(
      <PurchaseProvider>
        <Consumer />
      </PurchaseProvider>,
    )

    // When: despacha SELECT_EVENT
    await user.click(screen.getByRole('button', { name: 'seleccionar evento' }))

    // Then: el nuevo estado se refleja de inmediato
    expect(screen.getByText('currentStep: step-2-your-details')).toBeInTheDocument()
  })
})
