import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PurchaseStepper } from './PurchaseStepper'

describe('PurchaseStepper', () => {
  it('muestra los 5 pasos del flujo de compra (Context.md 5.4)', () => {
    // Given / When: se renderiza el header del stepper
    render(<PurchaseStepper currentStep="step-1-select-event" />)

    // Then: los cinco pasos son visibles
    expect(screen.getByText('Select Event')).toBeInTheDocument()
    expect(screen.getByText('Your Details')).toBeInTheDocument()
    expect(screen.getByText('Select Seat')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  it('marca el paso actual con aria-current, y ninguno de los demás', () => {
    // Given: el usuario está en el Paso 2
    // When: se renderiza el stepper
    render(<PurchaseStepper currentStep="step-2-your-details" />)

    // Then: sólo "Your Details" queda marcado como paso actual
    expect(screen.getByText('Your Details').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('Select Event').closest('li')).not.toHaveAttribute(
      'aria-current',
    )
    expect(screen.getByText('Select Seat').closest('li')).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('muestra un check en los pasos ya completados, antes del paso actual', () => {
    // Given: el usuario está en el Paso 3
    // When: se renderiza el stepper
    render(<PurchaseStepper currentStep="step-3-select-seat" />)

    // Then: los pasos 1 y 2 muestran el check de completado
    const pasoEvento = screen.getByText('Select Event').closest('li')
    const pasoDetalles = screen.getByText('Your Details').closest('li')
    expect(pasoEvento).toHaveTextContent('✓')
    expect(pasoDetalles).toHaveTextContent('✓')
  })

  it('no marca como completados los pasos siguientes al actual', () => {
    // Given: el usuario está en el Paso 1 (el primero)
    // When: se renderiza el stepper
    render(<PurchaseStepper currentStep="step-1-select-event" />)

    // Then: ningún paso posterior muestra el check de completado
    expect(screen.getByText('Your Details').closest('li')).not.toHaveTextContent('✓')
    expect(screen.getByText('Confirmation').closest('li')).not.toHaveTextContent('✓')
  })
})
