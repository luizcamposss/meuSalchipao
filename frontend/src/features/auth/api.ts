import { api } from '@/lib/api'
import type {
  LoginRequest,
  LoginResponse,
  Me,
  RegisterRequest,
  RegisterResponse,
} from '@/types/api'

export const authApi = {
  /** GET /auth/me — fluxo normal (401 -> refresh -> retry no boot). */
  me: (signal?: AbortSignal) => api.get<Me>('/auth/me', { signal }),

  /** rotas que estabelecem/derrubam a sessão: sem a dança de refresh. */
  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body, { skipAuthRefresh: true }),

  register: (body: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', body, { skipAuthRefresh: true }),

  logout: () =>
    api.post<void>('/auth/logout', undefined, { skipAuthRefresh: true }),
}
