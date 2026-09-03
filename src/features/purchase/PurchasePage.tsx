import { usePurchase } from '../../hooks/usePurchase'
import { PurchaseProvider } from '../../state/purchase/purchase.context'
import { SeatMapProvider } from '../../state/seat-map/seat-map.context'
import { PurchaseStepper } from './PurchaseStepper'
import { SelectEventStep } from './select-event/SelectEventStep'
import { YourDetailsStep } from './your-details/YourDetailsStep'
import { SelectSeatStep } from './select-seat/SelectSeatStep'
import { PaymentStep } from './payment/PaymentStep'

/**
 * Pantalla 3 — Purchase Flow (`/buy`, Context.md 5.4) — stepper completo:
 * TF-5 (Pasos 1-2), TF-6 (Paso 3, SpecSeatMap.md) y TF-7 (Pasos 4-5,
 * SpecPurchase.md). `PaymentStep` monta tanto Payment como Confirmation
 * (ver comentario en ese archivo) — por eso responde a ambos `currentStep`.
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
        state.currentStep === 'step-5-confirmation') && <PaymentStep />}
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
