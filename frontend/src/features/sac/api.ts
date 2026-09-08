import { api } from '@/lib/api'
import type {
  CreateTicketRequest,
  SacMessageResponse,
  SacTicketResponse,
  SacTicketStatus,
  UpdateTicketRequest,
} from '@/types/api'

export const sacApi = {
  listTickets: (signal?: AbortSignal) =>
    api.get<SacTicketResponse[]>('/sac/tickets', { signal }),

  // Staff: fila completa
  listAll: (status?: SacTicketStatus, signal?: AbortSignal) =>
    api.get<SacTicketResponse[]>('/sac/tickets/all', {
      query: status ? { status } : undefined,
      signal,
    }),

  getTicket: (id: string, signal?: AbortSignal) =>
    api.get<SacTicketResponse>(`/sac/tickets/${id}`, { signal }),

  createTicket: (body: CreateTicketRequest) =>
    api.post<SacTicketResponse>('/sac/tickets', body),

  addMessage: (id: string, message: string) =>
    api.post<SacMessageResponse>(`/sac/tickets/${id}/messages`, { message }),

  // Staff: muda status / prioridade
  updateTicket: (id: string, body: UpdateTicketRequest) =>
    api.patch<SacTicketResponse>(`/sac/tickets/${id}`, body),
}
