import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // dados "frescos" por 30s: evita refetch a cada mount
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx é erro do cliente — não adianta repetir.
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
