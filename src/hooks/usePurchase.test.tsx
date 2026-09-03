import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PurchaseProvider } from '../state/purchase/purchase.context'
import { usePurchase } from './usePurchase'

const ConsumerFueraDeProvider = () => {
  usePurchase()
  return null
}

const ConsumerDentroDeProvider = () => {
  const { state } = usePurchase()
  return <p>currentStep: {state.currentStep}</p>
}

describe('usePurchase', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lanza un error si se usa fuera de un PurchaseProvider', () => {
    // Given: un componente que llama a usePurchase sin ningún PurchaseProvider como ancestro
    // When / Then: el render falla con un mensaje claro
    expect(() => render(<ConsumerFueraDeProvider />)).toThrow(
      'usePurchase debe usarse dentro de un PurchaseProvider',
    )
  })

  it('devuelve el estado y el dispatch de la slice purchase cuando sí hay un PurchaseProvider', () => {
    // Given: el componente está dentro de un PurchaseProvider
    // When: se renderiza
    render(
      <PurchaseProvider>
        <ConsumerDentroDeProvider />
      </PurchaseProvider>,
    )

    // Then: obtiene el estado inicial de la slice, sin lanzar ningún error
    expect(screen.getByText('currentStep: step-1-select-event')).toBeInTheDocument()
  })
})
