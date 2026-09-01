import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../http/http.client'
import { processPayment } from './payment.service'

vi.mock('../http/http.client')

describe('payment.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('processPayment', () => {
    it('devuelve la confirmación del pago aprobado (200)', async () => {
      // Given: el backend aprueba el pago simulado (SpecHttp 7.7)
      vi.mocked(httpClient.post).mockResolvedValue({
        transactionId: 'txn-583921',
        status: 'approved',
        message: 'Payment approved. You will receive a confirmation email.',
        processedAt: '2026-07-04T15:30:00.000Z',
      })

      // When: se procesa un pago con tarjeta
      const result = await processPayment({ method: 'card' })

      // Then: se llama a POST /payment/process con el único campo aceptado (SpecHttp 6)
      expect(httpClient.post).toHaveBeenCalledWith('/payment/process', { method: 'card' })
      expect(result.transactionId).toBe('txn-583921')
    })

    it('propaga PAYMENT_DECLINED sin manejarlo — es responsabilidad del componente de Payment (402)', async () => {
      // Given: el backend rechaza el pago (10% de los casos, SpecHttp 7.7)
      const error = Object.assign(
        new Error('Your payment was declined. Please try again.'),
        {
          code: 'PAYMENT_DECLINED',
          status: 402,
        },
      )
      vi.mocked(httpClient.post).mockRejectedValue(error)

      // When: se procesa el pago y el backend lo rechaza
      const call = processPayment({ method: 'paypal' })

      // Then: el error llega intacto, sin transformar (SpecHttp 4.2)
      await expect(call).rejects.toBe(error)
    })

    it('propaga VALIDATION_ERROR cuando el método de pago no es válido (400)', async () => {
      // Given: un método de pago fuera del enum soportado
      const error = Object.assign(new Error('method must be card or paypal'), {
        code: 'VALIDATION_ERROR',
        status: 400,
      })
      vi.mocked(httpClient.post).mockRejectedValue(error)

      // When: se intenta procesar el pago
      const call = processPayment({ method: 'card' })

      // Then: el error llega tal cual a quien hizo la llamada
      await expect(call).rejects.toBe(error)
    })
  })
})
