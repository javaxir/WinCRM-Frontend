import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'

export interface TelegramBotSettingsResponse {
  id: number
  botUsername: string
  maskedToken: string
  active: boolean
  botConnected: boolean
  createdAt: string
  updatedAt: string
}

export interface TelegramBotRegisterDTO {
  botUsername: string
  token: string
}

export async function fetchTelegramBotSettings() {
  const res = await http.get<ApiResponse<TelegramBotSettingsResponse>>('/api/telegram/bot-settings')
  return unwrapData(res)
}

export async function registerTelegramBot(payload: TelegramBotRegisterDTO) {
  const res = await http.post<ApiResponse<TelegramBotSettingsResponse>>(
    '/api/telegram/bot-settings/register',
    payload,
  )
  return unwrapData(res)
}

export async function reconnectTelegramBot() {
  const res = await http.post<ApiResponse<TelegramBotSettingsResponse>>(
    '/api/telegram/bot-settings/reconnect',
  )
  return unwrapData(res)
}
