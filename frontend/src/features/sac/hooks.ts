import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  SacMessageResponse,
  SacTicketStatus,
  UpdateTicketRequest,
} from '@/types/api'

import { sacApi } from './api'

export const sacKeys = {
  tickets: ['sac', 'tickets'] as const,
  ticket: (id: string) => ['sac', 'tickets', id] as const,
  queue: (status?: SacTicketStatus) => ['sac', 'queue', status ?? 'all'] as const,
}

// ---- aluno: chat único --------------------------------------------------

/**
 * Chat único: usa o ticket mais recente que não esteja fechado (a lista já vem
 * ordenada por UpdatedAt desc). `null` = ainda não há conversa.
 */
export function useSacThread() {
  const list = useQuery({
    queryKey: sacKeys.tickets,
    queryFn: ({ signal }) => sacApi.listTickets(signal),
    staleTime: 10_000,
  })

  const active = list.data?.find((t) => t.status !== 'Closed') ?? null

  const thread = useQuery({
    queryKey: active ? sacKeys.ticket(active.id) : ['sac', 'tickets', 'none'],
    queryFn: ({ signal }) => sacApi.getTicket(active!.id, signal),
    enabled: !!active,
    refetchInterval: 4000,
  })

  const messages: SacMessageResponse[] = thread.data?.messages ?? []

  return {
    activeId: active?.id ?? null,
    messages,
    isLoading: list.isLoading || (!!active && thread.isLoading),
    isError: list.isError,
  }
}

export function useSendSacMessage(activeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      if (activeId) {
        await sacApi.addMessage(activeId, text)
        return
      }
      const subject = text.length > 60 ? `${text.slice(0, 57)}…` : text
      await sacApi.createTicket({ subject, description: text })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sacKeys.tickets })
    },
  })
}

// ---- staff ------------------------------------------------------------

export function useSacQueue(status?: SacTicketStatus) {
  return useQuery({
    queryKey: sacKeys.queue(status),
    queryFn: ({ signal }) => sacApi.listAll(status, signal),
    refetchInterval: 8000,
  })
}

export function useSacTicket(id: string) {
  return useQuery({
    queryKey: sacKeys.ticket(id),
    queryFn: ({ signal }) => sacApi.getTicket(id, signal),
    refetchInterval: 4000,
  })
}

export function useStaffReply(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => sacApi.addMessage(id, text),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sacKeys.ticket(id) })
      void qc.invalidateQueries({ queryKey: ['sac', 'queue'] })
    },
  })
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateTicketRequest) => sacApi.updateTicket(id, body),
    onSuccess: (ticket) => {
      qc.setQueryData(sacKeys.ticket(id), ticket)
      void qc.invalidateQueries({ queryKey: ['sac', 'queue'] })
    },
  })
}
