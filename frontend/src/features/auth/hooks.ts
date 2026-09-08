import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Me } from '@/types/api'

import { authApi } from './api'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * Sessão atual. `data` indefinido = deslogado (a query dá erro em 401 e
 * `retry: false` impede repetir). Os guards de rota leem isto.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      // popula o cache de sessão na hora e revalida o resto com a sessão nova
      qc.setQueryData<Me>(authKeys.me, {
        id: user.id,
        name: user.name,
        role: user.role,
      })
      void qc.invalidateQueries()
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.setQueryData(authKeys.me, null)
      qc.clear()
    },
  })
}
