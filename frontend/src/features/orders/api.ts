import { api } from '@/lib/api'
import type {
  CreateOrderRequest,
  OrderResponse,
  OrderStats,
  TicketResponse,
} from '@/types/api'

export const ordersApi = {
  create: (body: CreateOrderRequest) =>
    api.post<OrderResponse>('/orders', body),

  list: (signal?: AbortSignal) =>
    api.get<OrderResponse[]>('/orders', { signal }),

  // Staff: números do evento
  stats: (signal?: AbortSignal) =>
    api.get<OrderStats>('/orders/stats', { signal }),

  get: (id: string, signal?: AbortSignal) =>
    api.get<OrderResponse>(`/orders/${id}`, { signal }),

  getTicket: (id: string, signal?: AbortSignal) =>
    api.get<TicketResponse>(`/orders/${id}/ticket`, { signal }),

  redeem: (id: string) =>
    api.post<TicketResponse>(`/orders/${id}/redeem`),
}
