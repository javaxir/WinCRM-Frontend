// Bo'sh qoldiramiz: barcha /api so'rovlari Vite dev proxy orqali
// http://192.168.1.50:8081 ga uzatiladi (vite.config.ts dagi server.proxy).
// Bu CORS muammosini bartaraf qiladi.
import i18n from '@/i18n'

export const API_BASE_URL = ''

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TOKEN_TYPE_KEY = 'tokenType'

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(i18n.global.t('auth.wrongCredentials'))
    }
    throw new Error(`${i18n.global.t('common.error')} (${response.status})`)
  }

  const data: LoginResponse = await response.json()
  saveTokens(data)
  return data
}

export function saveTokens(data: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, data.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  localStorage.setItem(TOKEN_TYPE_KEY, data.tokenType)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
}

// Faqat lokal tozalash (eski nom saqlanadi, boshqa joyda ishlatilgan).
export function logout() {
  clearTokens()
}

// Serverda ham tokenni bekor qiladi (blacklist), so'ng lokalni tozalaydi.
export async function serverLogout(): Promise<void> {
  const token = getAccessToken()
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    }
  } catch {
    // Server bilan aloqa bo'lmasa ham lokal chiqish davom etadi.
  } finally {
    clearTokens()
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data: LoginResponse = await response.json()
    saveTokens(data)
    return data.accessToken
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

// JWT ichidagi "sub" (username) ni o'qiydi.
export function getUsername(): string | null {
  const token = getAccessToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    )
    return payload ? (json.sub ?? null) : null
  } catch {
    return null
  }
}
