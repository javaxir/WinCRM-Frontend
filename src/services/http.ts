import { API_BASE_URL, getAccessToken, clearTokens, refreshAccessToken } from './auth'
import i18n from '@/i18n'
import { translateApiError } from '@/utils/translateApiError'

function redirectToLogin() {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/login')) return
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?redirect=${redirect}`
}

export interface ApiError {
  status: number
  error?: string
  message: string
  path?: string
  timestamp?: string
}

export class HttpRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpRequestError'
    this.status = status
  }
}

export function isHttpRequestError(error: unknown): error is HttpRequestError {
  return error instanceof HttpRequestError
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }
  // FormData uchun Content-Type qo'ymaymiz — browser boundary bilan o'zi qo'shadi.
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (response.status === 401) {
    // Bir marta refresh token orqali yangilashga urinamiz.
    if (!isRetry) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        return request<T>(path, options, true)
      }
    }
    clearTokens()
    redirectToLogin()
    throw new Error(i18n.global.t('auth.sessionExpired'))
  }

  if (!response.ok) {
    let message = `${i18n.global.t('common.error')} (${response.status})`
    try {
      const data = (await response.json()) as ApiError
      if (data?.message) {
        message = translateApiError(data.message, response.status)
      } else if (response.status === 403) {
        message = i18n.global.t('common.accessDenied')
      }
    } catch {
      if (response.status === 403) {
        message = i18n.global.t('common.accessDenied')
      }
    }
    throw new HttpRequestError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  putForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
