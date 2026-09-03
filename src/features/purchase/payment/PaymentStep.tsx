import { useState, type FormEvent } from 'react'
import { usePurchase } from '../../../hooks/usePurchase'
import { useSeatMap } from '../../../hooks/useSeatMap'
import { processPayment } from '../../../services/payment.service'
import { createBooking } from '../../../services/bookings.service'
import { ApiError } from '../../../http/http.types'
import { APP_CONFIG } from '../../../config/app.config'
import type { Booking } from '../../../schemas/booking.schema'
import { ConfirmationStep } from '../confirmation/ConfirmationStep'
import {
  PaymentFormSchema,
  formatCardNumber,
  formatCvv,
  formatExpirationDate,
  EMPTY_CARD_FIELDS,
  type CardPaymentFormValues,
} from './payment-form.schema'
import styles from './PaymentStep.module.css'

type PaymentMethod = 'card' | 'paypal'
type SubmitStatus = 'idle' | 'submitting-payment' | 'submitting-booking'
type CardFields = Omit<CardPaymentFormValues, 'method'>
type FieldErrors = Partial<Record<keyof CardFields, string>>

const FIELD_FORMATTERS: Record<keyof CardFields, (raw: string) => string> = {
  cardNumber: formatCardNumber,
  expirationDate: formatExpirationDate,
  cvv: formatCvv,
  cardholderName: (raw) => raw,
}

/**
 * Paso 4 — Payment, y Paso 5 — Confirmation (Context.md 5.4, SpecPurchase
 * 2.1/2.2/3.2/4). Un único componente monta ambos pasos: la reserva creada
 * por `POST /bookings` (Booking ID, resumen — necesaria para el Paso 5) no
 * es un campo de la slice `purchase` (Context.md 8.4 sólo fija
 * `selectedEvent`/`contactDetails`/`selectedSeat`/`paymentResult`), así que
 * vive en estado local que sobrevive la transición step-4 → step-5 sin un
 * fetch adicional (Context.md 5.4 Paso 5: "no se necesita un fetch
 * adicional") ni inventar un campo de slice no autorizado.
 */
export const PaymentStep = () => {
  const { state: purchaseState, dispatch: purchaseDispatch } = usePurchase()
  const { dispatch: seatMapDispatch } = useSeatMap()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [cardFields, setCardFields] = useState<CardFields>(EMPTY_CARD_FIELDS)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [declineMessage, setDeclineMessage] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)

  const { selectedEvent, selectedSeat, contactDetails } = purchaseState

  if (purchaseState.currentStep === 'step-5-confirmation' && booking) {
    return (
      <ConfirmationStep
        booking={booking}
        onBuyAnother={() => purchaseDispatch({ type: 'BUY_ANOTHER' })}
      />
    )
  }

  if (!selectedEvent || !selectedSeat || !contactDetails) {
    return null
  }

  const basePrice = selectedSeat.zonePrice
  const total = basePrice + APP_CONFIG.serviceFee
  const isSubmitting = status !== 'idle'

  const handleCardFieldChange = (field: keyof CardFields, rawValue: string) => {
    setCardFields((current) => ({
      ...current,
      [field]: FIELD_FORMATTERS[field](rawValue),
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDeclineMessage(null)

    const formValues =
      method === 'card' ? { method, ...cardFields } : { method: 'paypal' as const }
    const result = PaymentFormSchema.safeParse(formValues)
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors as Record<
        keyof CardFields,
        string[] | undefined
      >
      setFieldErrors({
        cardNumber: issues.cardNumber?.[0],
        expirationDate: issues.expirationDate?.[0],
        cvv: issues.cvv?.[0],
        cardholderName: issues.cardholderName?.[0],
      })
      return
    }
    setFieldErrors({})
    setStatus('submitting-payment')

    try {
      const paymentResult = await processPayment({ method })
      purchaseDispatch({ type: 'PAYMENT_APPROVED', payload: { paymentResult } })
      setStatus('submitting-booking')

      const createdBooking = await createBooking({
        eventId: selectedEvent.id,
        seatId: selectedSeat.seatId,
        contactEmail: contactDetails.email,
        contactPhone: contactDetails.phone,
        payment: { method, transactionId: paymentResult.transactionId },
        total,
      })
      setBooking(createdBooking)
      purchaseDispatch({ type: 'BOOKING_CREATED' })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PAYMENT_DECLINED') {
        // Rechazo (SpecPurchase 2.1): vuelve a idle sin perder los datos ya escritos.
        setDeclineMessage(error.message)
        setStatus('idle')
        return
      }
      if (error instanceof ApiError && error.code === 'SEAT_UNAVAILABLE') {
        // Pago aprobado pero asiento perdido mientras tanto (SpecPurchase 2.2,
        // SpecSeatMap 4.5): revalida seatMap y vuelve al Paso 3.
        seatMapDispatch({ type: 'SEAT_CONFLICT_DETECTED' })
        purchaseDispatch({ type: 'SEAT_TAKEN_MEANWHILE' })
        return
      }
      // Otros códigos (400/500) no tienen copia específica fijada por el Spec —
      // 500 ya muestra el toast genérico global (SpecHttp 4.2). Se libera el botón.
      setStatus('idle')
    }
  }

  const field = (name: keyof CardFields, label: string, placeholder: string) => (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        placeholder={placeholder}
        value={cardFields[name]}
        disabled={isSubmitting}
        onChange={(event) => handleCardFieldChange(name, event.target.value)}
        aria-invalid={Boolean(fieldErrors[name])}
        aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
      />
      {fieldErrors[name] && (
        <p id={`${name}-error`} className={styles.fieldError}>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.methods}>
        <button
          type="button"
          className={
            method === 'card'
              ? `${styles.method} ${styles.methodSelected}`
              : styles.method
          }
          aria-pressed={method === 'card'}
          disabled={isSubmitting}
          onClick={() => setMethod('card')}
        >
          💳 Credit card
        </button>
        <button
          type="button"
          className={
            method === 'paypal'
              ? `${styles.method} ${styles.methodSelected}`
              : styles.method
          }
          aria-pressed={method === 'paypal'}
          disabled={isSubmitting}
          onClick={() => setMethod('paypal')}
        >
          🅿️ PayPal
        </button>
      </div>

      {method === 'card' ? (
        <div className={styles.cardFields}>
          {field('cardNumber', 'Card number', 'XXXX XXXX XXXX XXXX')}
          <div className={styles.row}>
            {field('expirationDate', 'Expiration date', 'MM/YY')}
            {field('cvv', 'CVV', '123')}
          </div>
          {field('cardholderName', 'Cardholder name', 'Sofía Hernández')}
        </div>
      ) : (
        <p className={styles.paypalNote}>
          Serás redirigido a PayPal para completar el pago.
        </p>
      )}

      {declineMessage && (
        <p className={styles.declineError} role="alert">
          {declineMessage}
        </p>
      )}

      <div className={styles.summary}>
        <p className={styles.summaryTitle}>{selectedEvent.name}</p>
        <p className={styles.summaryLine}>
          {selectedEvent.date} · {selectedEvent.time}
        </p>
        <p className={styles.summaryLine}>
          Fila {selectedSeat.row}, Columna {selectedSeat.col} — {selectedSeat.zoneName}
        </p>
        <p className={styles.summaryLine}>Precio base: ${basePrice.toFixed(2)}</p>
        <p className={styles.summaryLine}>
          Service fee: ${APP_CONFIG.serviceFee.toFixed(2)}
        </p>
        <p className={styles.total}>Total: ${total.toFixed(2)}</p>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.back}
          disabled={isSubmitting}
          onClick={() => purchaseDispatch({ type: 'GO_BACK' })}
        >
          Back
        </button>
        <button type="submit" className={styles.pay} disabled={isSubmitting}>
          {status === 'idle' && `Pay $${total.toFixed(2)}`}
          {status === 'submitting-payment' && 'Procesando pago…'}
          {status === 'submitting-booking' && 'Confirmando reserva…'}
        </button>
      </div>
    </form>
  )
}
