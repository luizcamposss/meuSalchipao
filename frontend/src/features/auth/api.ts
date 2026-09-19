import { api } from '@/lib/api'
import type {
  LoginRequest,
  LoginResponse,
  Me,
  RegisterRequest,
  RegisterResponse,
  StaffResetPasswordRequest,
  StaffResetPasswordResponse,
} from '@/types/api'

export const authApi = {
  me: (signal?: AbortSignal) => api.get<Me>('/auth/me', { signal }),

  login: (body: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', body, { skipAuthRefresh: true }),

  register: (body: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', body, { skipAuthRefresh: true }),

  logout: () =>
    api.post<void>('/auth/logout', undefined, { skipAuthRefresh: true }),

  staffResetPassword: (body: StaffResetPasswordRequest) =>
    api.post<StaffResetPasswordResponse>('/auth/staff/reset-password', body),
}
