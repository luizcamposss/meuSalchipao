import type { ProblemDetails } from '@/types/api'

/**
 * Cliente HTTP único do app.
 *
 * - manda sempre o cookie (`credentials: 'include'`); nenhum token passa por JS.
 * - em 401: tenta `POST /auth/refresh` UMA vez, repete a request original.
 *   Se o refresh falhar, dispara o handler de logout (registrado pelo app) e
 *   propaga o erro.
 * - erros viram `ApiError` com o `title`/`detail` do ProblemDetails do backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetails

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  /** erros de validação por campo (RFC 7807 `errors`), quando houver */
  get fieldErrors(): Record<string, string[]> | undefined {
    return this.problem?.errors
  }
}

// --- handler de logout, injetado pelo app (evita api.ts depender do router) ---

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

// --- refresh coalescido: N chamadas em 401 disparam UM refresh só -----------

let refreshInFlight: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

// --- núcleo -------------------------------------------------------------

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** objeto serializado como JSON; pule para GET */
  body?: unknown
  signal?: AbortSignal
  query?: Record<string, string | number | boolean | undefined | null>
  /** pula a dança de refresh (usado pelas próprias rotas de auth) */
  skipAuthRefresh?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE_URL}${path}`
  if (!query) return url
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.append(k, String(v))
  }
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

async function raw(path: string, opts: RequestOptions): Promise<Response> {
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers:
      opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
}

async function toApiError(res: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined
  try {
    const data = await res.json()
    if (data && typeof data === 'object') problem = data as ProblemDetails
  } catch {
    // corpo vazio ou não-JSON
  }
  const message =
    problem?.title ?? problem?.detail ?? res.statusText ?? `HTTP ${res.status}`
  return new ApiError(res.status, message, problem)
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export async function apiFetch<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await raw(path, opts)

  if (res.status === 401 && !opts.skipAuthRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      res = await raw(path, opts)
    } else {
      onUnauthorized?.()
      throw await toApiError(res)
    }
  }

  if (!res.ok) throw await toApiError(res)
  return parse<T>(res)
}

// --- açúcar -----------------------------------------------------------

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
}
