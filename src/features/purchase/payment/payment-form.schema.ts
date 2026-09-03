import { z } from 'zod'

/**
 * Paso 4 — Pago (SpecPurchase 3.2, Context.md 5.4). Validación puramente de
 * cliente: estos campos nunca viajan al backend, `POST /payment/process`
 * sólo acepta `{ method }` (SpecHttp 6/7.7) — por eso vive junto a la
 * feature, no en `schemas/` (SpecProject 3.4, mismo criterio que
 * `contact-details.schema`).
 */
const CardPaymentFormSchema = z.object({
  method: z.literal('card'),
  cardNumber: z
    .string()
    .regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'El número de tarjeta debe tener 16 dígitos'),
  expirationDate: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/\d{2}$/,
      'La fecha de expiración debe tener el formato MM/YY',
    ),
  cvv: z.string().regex(/^\d{3}$/, 'El CVV debe tener 3 dígitos'),
  cardholderName: z.string().min(1, 'El nombre del titular es obligatorio'),
})

const PaypalPaymentFormSchema = z.object({
  method: z.literal('paypal'),
})

export const PaymentFormSchema = z.discriminatedUnion('method', [
  CardPaymentFormSchema,
  PaypalPaymentFormSchema,
])

export type PaymentFormValues = z.infer<typeof PaymentFormSchema>
export type CardPaymentFormValues = z.infer<typeof CardPaymentFormSchema>

/** Campos de tarjeta vacíos — estado inicial del formulario (método `card`). */
export const EMPTY_CARD_FIELDS: Omit<CardPaymentFormValues, 'method'> = {
  cardNumber: '',
  expirationDate: '',
  cvv: '',
  cardholderName: '',
}

/** Autoformatea el número de tarjeta como `XXXX XXXX XXXX XXXX` (Context.md 5.4). */
export const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return (digits.match(/.{1,4}/g) ?? []).join(' ')
}

/** Autoformatea la fecha de expiración como `MM/YY` (Context.md 5.4). */
export const formatExpirationDate = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

/** El CVV son exactamente 3 dígitos (Context.md 5.4). */
export const formatCvv = (raw: string): string => raw.replace(/\D/g, '').slice(0, 3)
