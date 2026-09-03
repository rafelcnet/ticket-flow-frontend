import { usePurchase } from '../../hooks/usePurchase'
import { PurchaseProvider } from '../../state/purchase/purchase.context'
import { SeatMapProvider } from '../../state/seat-map/seat-map.context'
import { PurchaseStepper } from './PurchaseStepper'
import { SelectEventStep } from './select-event/SelectEventStep'
import { YourDetailsStep } from './your-details/YourDetailsStep'
import { SelectSeatStep } from './select-seat/SelectSeatStep'

/**
 * Pantalla 3 — Purchase Flow (`/buy`, Context.md 5.4).
 * TF-5 implementó los Pasos 1 y 2; TF-6 añade el Paso 3 (SpecSeatMap.md).
 * Pago y confirmación quedan como marcador de posición hasta TF-7.
 */
const PurchaseStepperContent = () => {
  const { state } = usePurchase()

  return (
    <section>
      <PurchaseStepper currentStep={state.currentStep} />
      {state.currentStep === 'step-1-select-event' && <SelectEventStep />}
      {state.currentStep === 'step-2-your-details' && <YourDetailsStep />}
      {state.currentStep === 'step-3-select-seat' && <SelectSeatStep />}
      {(state.currentStep === 'step-4-payment' ||
        state.currentStep === 'step-5-confirmation') && <p>Próximamente disponible.</p>}
    </section>
  )
}

export const PurchasePage = () => (
  <PurchaseProvider>
    <SeatMapProvider>
      <PurchaseStepperContent />
    </SeatMapProvider>
  </PurchaseProvider>
)
