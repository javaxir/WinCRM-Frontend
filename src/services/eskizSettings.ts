import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'

export interface EskizSettingsResponse {
  configured: boolean
  email: string
  tokenActive: boolean
  tokenExpiresAt: string
  updatedAt: string
}

export interface EskizSettingsDTO {
  email: string
  password: string
}

export async function fetchEskizSettings() {
  const res = await http.get<ApiResponse<EskizSettingsResponse>>('/api/eskiz-settings')
  return unwrapData(res)
}

export async function saveEskizSettings(payload: EskizSettingsDTO) {
  const res = await http.post<ApiResponse<EskizSettingsResponse>>('/api/eskiz-settings', payload)
  return unwrapData(res)
}

/** Token holatini yangilash / olish */
export async function fetchEskizTokenStatus() {
  const res = await http.get<ApiResponse<EskizSettingsResponse>>('/api/eskiz-settings/token')
  return unwrapData(res)
}
