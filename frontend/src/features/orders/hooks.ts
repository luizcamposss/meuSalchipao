import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ordersApi } from './api'

export const orderKeys = {
  list: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
  ticket: (id: string) => ['orders', id, 'ticket'] as const,
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: ({ signal }) => ordersApi.list(signal),
    staleTime: 15_000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => ordersApi.get(id, signal),
    staleTime: 10_000,
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: orderKeys.ticket(id),
    queryFn: ({ signal }) => ordersApi.getTicket(id, signal),
    staleTime: 10_000,
    retry: false,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orderKeys.list })
    },
  })
}

export function useRedeem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ordersApi.redeem(id),
    onSuccess: (ticket) => {
      qc.setQueryData(orderKeys.ticket(id), ticket)
      void qc.invalidateQueries({ queryKey: orderKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: orderKeys.list })
    },
  })
}
