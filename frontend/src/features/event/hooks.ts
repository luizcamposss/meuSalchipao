import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { EventPhaseSnapshot } from '@/types/api'

import { eventApi } from './api'

export const eventKeys = {
  snapshot: ['event'] as const,
}

export function useEvent() {
  return useQuery({
    queryKey: eventKeys.snapshot,
    queryFn: ({ signal }) => eventApi.get(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventApi.update,
    onSuccess: (snapshot) => {
      qc.setQueryData(eventKeys.snapshot, snapshot)
    },
  })
}

export function useEventLive() {
  return useQuery({
    queryKey: eventKeys.snapshot,
    queryFn: ({ signal }) => eventApi.get(signal),
    refetchInterval: 5_000,
    staleTime: 2_000,
  })
}

export function useCreateSaleWindow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventApi.createSaleWindow,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: eventKeys.snapshot })
    },
  })
}

export function useUpdateSaleWindow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Parameters<typeof eventApi.updateSaleWindow>[1]
    }) => eventApi.updateSaleWindow(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: eventKeys.snapshot })
    },
  })
}

export function useDeleteSaleWindow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: eventApi.deleteSaleWindow,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: eventKeys.snapshot })
    },
  })
}

export type PhaseMode = 'before' | 'selling' | 'redeeming' | 'closed'

const MODE_BY_PHASE: Record<EventPhaseSnapshot['phase'], PhaseMode> = {
  BeforeSales: 'before',
  SalesOpen: 'selling',
  RedemptionOnly: 'redeeming',
  SalesClosed: 'closed',
}

export interface Phase {
  mode: PhaseMode
  snapshot: EventPhaseSnapshot
  now: string
}

export function usePhase() {
  const query = useEvent()
  const phase: Phase | null = query.data
    ? {
        mode: MODE_BY_PHASE[query.data.phase],
        snapshot: query.data,
        now: query.data.serverTime,
      }
    : null
  return {
    phase,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
