import { useQuery } from '@tanstack/react-query'

import type { PaymentStatus } from '@/types/api'

import { paymentsApi } from './api'

const TERMINAL: PaymentStatus[] = ['Approved', 'Rejected', 'Expired', 'Refunded']

export const paymentKeys = {
  charge: (orderId: string) => ['payment-charge', orderId] as const,
  status: (paymentId: string) => ['payment', paymentId] as const,
}

export function useOrderCharge(orderId: string) {
  return useQuery({
    queryKey: paymentKeys.charge(orderId),
    queryFn: () => paymentsApi.createForOrder(orderId),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
  })
}

export function usePaymentStatus(paymentId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.status(paymentId ?? 'none'),
    queryFn: ({ signal }) => paymentsApi.get(paymentId!, signal),
    enabled: !!paymentId,
    refetchInterval: (query) =>
      query.state.data && TERMINAL.includes(query.state.data.status)
        ? false
        : 3000,
    refetchIntervalInBackground: true,
  })
}
