import { useQuery } from '@tanstack/react-query'

import { catalogApi } from './api'

export const catalogKeys = {
  list: ['products'] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: catalogKeys.list,
    queryFn: ({ signal }) => catalogApi.list(signal),
    staleTime: 5 * 60_000,
  })
}

export function useSalchipao() {
  const query = useProducts()
  return { ...query, product: query.data?.[0] ?? null }
}
