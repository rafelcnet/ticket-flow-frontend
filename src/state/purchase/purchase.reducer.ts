import type { PaymentResponse } from '../../schemas/payment.schema'
import type { Event } from '../../schemas/events.schema'
import type { ContactDetails } from '../../features/purchase/your-details/contact-details.schema'

/**
 * Pasos del stepper de compra (SpecPurchase 2, Context.md 5.4/6.2) —
 * nombres literales del Spec, no abreviados. TF-7 añade pago y confirmación
 * (step-4 → step-5). Los sub-estados de step-4 (`idle` / `submitting-payment`
 * / `submitting-booking`, SpecPurchase 2.1) y la reserva creada por
 * `POST /bookings` no son campos de esta slice (Context.md 8.4 sólo fija
 * `selectedEvent`/`contactDetails`/`selectedSeat`/`paymentResult`) — viven
 * como estado local de `PaymentStep`, igual que `venueType` en TF-6.
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
 * FSM del stepper (SpecPurchase 2.1) — transiciones de TF-5, TF-6 y TF-7.
 * `SUBMIT_PAYMENT` y `PAYMENT_DECLINED` no despachan a esta slice: son
 * transiciones puramente locales del sub-estado de `PaymentStep`, que no
 * cambian ningún campo de `purchase` (ver comentario de `PurchaseStep`).
 */
export type PurchaseAction =
  | { type: 'SELECT_EVENT'; payload: { event: Event } }
  | { type: 'GO_BACK' }
  | { type: 'CONFIRM_DETAILS'; payload: { contactDetails: ContactDetails } }
  | { type: 'SELECT_SEAT'; payload: { seat: ResolvedSeat } }
  | { type: 'PAYMENT_APPROVED'; payload: { paymentResult: PaymentResponse } }
  | { type: 'BOOKING_CREATED' }
  | { type: 'SEAT_TAKEN_MEANWHILE' }
  | { type: 'BUY_ANOTHER' }

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
    case 'SELECT_SEAT':
      return {
        ...state,
        selectedSeat: action.payload.seat,
        currentStep: 'step-4-payment',
      }
    case 'PAYMENT_APPROVED':
      // Permanece en step-4-payment (SpecPurchase 2.1: sub-estado
      // submitting-booking) — sólo BOOKING_CREATED avanza al Paso 5.
      return {
        ...state,
        paymentResult: action.payload.paymentResult,
      }
    case 'BOOKING_CREATED':
      return {
        ...state,
        currentStep: 'step-5-confirmation',
      }
    case 'SEAT_TAKEN_MEANWHILE':
      // 409 SEAT_UNAVAILABLE al crear la reserva (SpecPurchase 2.2): el
      // asiento y el pago ya aprobado quedan obsoletos — se revalida el
      // mapa de asientos (fuera de esta slice) y se vuelve al Paso 3.
      return {
        ...state,
        selectedSeat: null,
        paymentResult: null,
        currentStep: 'step-3-select-seat',
      }
    case 'BUY_ANOTHER':
      // Alcance del reinicio fijado en SpecState 3.4: selectedEvent,
      // selectedSeat y paymentResult se limpian; contactDetails se conserva
      // (el Paso 2 lo vuelve a prellenar de todas formas al entrar).
      return {
        ...state,
        currentStep: 'step-1-select-event',
        selectedEvent: null,
        selectedSeat: null,
        paymentResult: null,
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
