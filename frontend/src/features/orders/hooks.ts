import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ordersApi } from './api'

export const orderKeys = {
  list: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
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
