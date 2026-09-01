import {
  PaymentResponseSchema,
  type PaymentRequest,
  type PaymentResponse,
} from '../schemas/payment.schema'
import { httpClient } from '../http/http.client'

/**
 * `POST /payment/process` (SpecHttp 7.7).
 * `PAYMENT_DECLINED` (402) se deja propagar sin transformar — lo maneja el
 * componente de Payment, nunca el interceptor global (SpecHttp 4.2).
 */
export const processPayment = async (
  payload: PaymentRequest,
): Promise<PaymentResponse> => {
  const response = await httpClient.post<PaymentResponse>('/payment/process', payload)
  return PaymentResponseSchema.parse(response)
}
