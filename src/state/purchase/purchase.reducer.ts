import type { PaymentResponse } from '../../schemas/payment.schema'
import type { Event } from '../../schemas/events.schema'
import type { ContactDetails } from '../../features/purchase/your-details/contact-details.schema'

/**
 * Pasos del stepper de compra (SpecPurchase 2, Context.md 5.4/6.2) —
 * nombres literales del Spec, no abreviados. TF-5 sólo implementa las
 * transiciones hacia/desde `step-1` y `step-2`; el resto de la FSM
 * (selección de asiento, pago, confirmación) llega con sus tickets.
 */
export type PurchaseStep =
  | 'step-1-select-event'
  | 'step-2-your-details'
  | 'step-3-select-seat'
  | 'step-4-payment'
  | 'step-5-confirmation'

/**
 * Asiento ya resuelto contra `zones[]` (SpecPurchase 1, 4.2/4.3) — se fija
 * aquí porque el Spec de este ticket ya describe su forma, aunque la
 * transición que lo puebla (`SELECT_SEAT`) no se implemente todavía.
 */
export interface ResolvedSeat {
  seatId: string
  row: number
  col: number
  zoneName: string
  zonePrice: number
}

/** Slice `purchase` (Context.md 8.4, SpecPurchase 1 — campos sin cambios). */
export interface PurchaseState {
  currentStep: PurchaseStep
  selectedEvent: Event | null
  contactDetails: ContactDetails | null
  selectedSeat: ResolvedSeat | null
  paymentResult: PaymentResponse | null
}

export const initialPurchaseState: PurchaseState = {
  currentStep: 'step-1-select-event',
  selectedEvent: null,
  contactDetails: null,
  selectedSeat: null,
  paymentResult: null,
}

const PREVIOUS_STEP: Partial<Record<PurchaseStep, PurchaseStep>> = {
  'step-2-your-details': 'step-1-select-event',
  'step-3-select-seat': 'step-2-your-details',
  'step-4-payment': 'step-3-select-seat',
}

/**
 * FSM del stepper (SpecPurchase 2.1) — sólo las transiciones de TF-5.
 * `SELECT_SEAT`, `SUBMIT_PAYMENT` y el resto llegan con TF-6/TF-7, cuando
 * sus Specs (`SpecSeatMap.md`) formen parte del contexto de arquitectura.
 */
export type PurchaseAction =
  | { type: 'SELECT_EVENT'; payload: { event: Event } }
  | { type: 'GO_BACK' }
  | { type: 'CONFIRM_DETAILS'; payload: { contactDetails: ContactDetails } }

export const purchaseReducer = (
  state: PurchaseState,
  action: PurchaseAction,
): PurchaseState => {
  switch (action.type) {
    case 'SELECT_EVENT':
      return {
        ...state,
        selectedEvent: action.payload.event,
        currentStep: 'step-2-your-details',
      }
    case 'CONFIRM_DETAILS':
      return {
        ...state,
        contactDetails: action.payload.contactDetails,
        currentStep: 'step-3-select-seat',
      }
    case 'GO_BACK':
      return {
        ...state,
        currentStep: PREVIOUS_STEP[state.currentStep] ?? state.currentStep,
      }
    default:
      return state
  }
}
