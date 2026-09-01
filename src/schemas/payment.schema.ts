import { z } from 'zod'

/**
 * `POST /payment/process` — request body (SpecHttp 7.7).
 * Único campo aceptado por el backend: no hay `simulated` ni header de
 * idempotencia (SpecHttp 6).
 */
export const PaymentRequestSchema = z.object({
  method: z.enum(['card', 'paypal']),
})

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>

/** `POST /payment/process` — 200 OK, pago aprobado (SpecHttp 7.7). */
export const PaymentResponseSchema = z.object({
  transactionId: z.string(),
  status: z.literal('approved'),
  message: z.string(),
  processedAt: z.string(),
})

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>
