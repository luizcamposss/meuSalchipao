import { api } from '@/lib/api'
import type { PaymentResponse } from '@/types/api'

export const paymentsApi = {
  createForOrder: (orderId: string) =>
    api.post<PaymentResponse>(`/orders/${orderId}/payment`),

  get: (paymentId: string, signal?: AbortSignal) =>
    api.get<PaymentResponse>(`/payments/${paymentId}`, { signal }),
}
