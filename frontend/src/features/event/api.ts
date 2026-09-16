import { api } from '@/lib/api'
import type {
  CreateSaleWindowRequest,
  EventPhaseSnapshot,
  SaleWindowResponse,
  UpdateEventRequest,
  UpdateSaleWindowRequest,
} from '@/types/api'

export const eventApi = {
  get: (signal?: AbortSignal) =>
    api.get<EventPhaseSnapshot>('/event', { signal }),

  update: (body: UpdateEventRequest) =>
    api.put<EventPhaseSnapshot>('/event', body),

  createSaleWindow: (body: CreateSaleWindowRequest) =>
    api.post<SaleWindowResponse>('/event/sale-windows', body),

  updateSaleWindow: (id: string, body: UpdateSaleWindowRequest) =>
    api.put<SaleWindowResponse>(`/event/sale-windows/${id}`, body),

  deleteSaleWindow: (id: string) =>
    api.del<void>(`/event/sale-windows/${id}`),
}
