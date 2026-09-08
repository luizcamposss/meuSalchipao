import { api } from '@/lib/api'
import type { PaymentResponse } from '@/types/api'

export const paymentsApi = {
  /** Cria (ou devolve a cobrança viva) do pedido. Rate-limited no backend. */
  createForOrder: (orderId: string) =>
    api.post<PaymentResponse>(`/orders/${orderId}/payment`),

  /** Poll do status. */
  get: (paymentId: string, signal?: AbortSignal) =>
    api.get<PaymentResponse>(`/payments/${paymentId}`, { signal }),
}
