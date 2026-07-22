import { http } from './http'
import type { ApiResponse } from './roles'

export interface AuditLog {
  id: number
  username: string
  entity: string
  action: string
  description: string
  createdAt: string
  ipAddress: string
}

export async function fetchAllAuditLogs() {
  const res = await http.get<ApiResponse<AuditLog[]> | AuditLog[]>('/api/audit/logs')
  if (Array.isArray(res)) return res
  return res.data
}
