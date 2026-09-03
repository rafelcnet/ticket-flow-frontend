import { usePurchase } from '../../hooks/usePurchase'
import { PurchaseProvider } from '../../state/purchase/purchase.context'
import { PurchaseStepper } from './PurchaseStepper'
import { SelectEventStep } from './select-event/SelectEventStep'
import { YourDetailsStep } from './your-details/YourDetailsStep'

/**
 * Pantalla 3 — Purchase Flow (`/buy`, Context.md 5.4).
 * TF-5 implementa los Pasos 1 y 2; el resto queda como marcador de posición
 * hasta sus tickets correspondientes (SpecSeatMap.md para el Paso 3,
 * pago/confirmación para TF-7).
 */
const PurchaseStepperContent = () => {
  const { state } = usePurchase()

  return (
    <section>
      <PurchaseStepper currentStep={state.currentStep} />
      {state.currentStep === 'step-1-select-event' && <SelectEventStep />}
      {state.currentStep === 'step-2-your-details' && <YourDetailsStep />}
      {(state.currentStep === 'step-3-select-seat' ||
        state.currentStep === 'step-4-payment' ||
        state.currentStep === 'step-5-confirmation') && <p>Próximamente disponible.</p>}
    </section>
  )
}

export const PurchasePage = () => (
  <PurchaseProvider>
    <PurchaseStepperContent />
  </PurchaseProvider>
)
