import { api } from '@/lib/api'
import type { CreateOrderRequest, OrderResponse } from '@/types/api'

export const ordersApi = {
  create: (body: CreateOrderRequest) =>
    api.post<OrderResponse>('/orders', body),

  list: (signal?: AbortSignal) =>
    api.get<OrderResponse[]>('/orders', { signal }),

  get: (id: string, signal?: AbortSignal) =>
    api.get<OrderResponse>(`/orders/${id}`, { signal }),
}
