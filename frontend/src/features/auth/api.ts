import { api } from '@/lib/api'
import type { LoginRequest, LoginResponse, Me } from '@/types/api'

export const authApi = {
  /** GET /auth/me — fluxo normal (401 -> refresh -> retry no boot). */
  me: (signal?: AbortSignal) => api.get<Me>('/auth/me', { signal }),

  /** rotas que estabelecem/derrubam a sessão: sem a dança de refresh. */
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body, { skipAuthRefresh: true }),

  logout: () =>
    api.post<void>('/auth/logout', undefined, { skipAuthRefresh: true }),
}
