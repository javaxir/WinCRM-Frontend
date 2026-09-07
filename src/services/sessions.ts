import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'

export type SessionStatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE'

export interface SessionResponse {
  id: number
  username: string
  ipAddress: string | null
  userAgent: string | null
  deviceName: string | null
  createdAt: string
  lastSeenAt: string | null
  expiresAt: string | null
  online: boolean
  current: boolean
  revoked: boolean
  expired: boolean
}

export interface SessionSummaryResponse {
  totalSessions: number
  onlineSessions: number
  onlineUsers: number
  offlineUsers: number
}

export interface SessionsFilter {
  username?: string
  status?: SessionStatusFilter
}

export async function fetchSessions(filter: SessionsFilter = {}) {
  const params = new URLSearchParams()
  if (filter.username?.trim()) params.set('username', filter.username.trim())
  if (filter.status && filter.status !== 'ALL') params.set('status', filter.status)
  else if (filter.status === 'ALL') params.set('status', 'ALL')
  const query = params.toString()
  const res = await http.get<ApiResponse<unknown> | SessionResponse[]>(
    `/api/sessions${query ? `?${query}` : ''}`,
  )
  return unwrapListContent<SessionResponse>(res)
}

export async function fetchSessionsSummary() {
  const res = await http.get<ApiResponse<SessionSummaryResponse> | SessionSummaryResponse>(
    '/api/sessions/summary',
  )
  return unwrapData(res)
}

export function revokeSession(id: number) {
  return http.delete<unknown>(`/api/sessions/${id}`)
}

export function revokeUserSessions(username: string) {
  return http.delete<unknown>(`/api/sessions/user/${encodeURIComponent(username)}`)
}

export function revokeOtherSessions() {
  return http.delete<unknown>('/api/sessions')
}
