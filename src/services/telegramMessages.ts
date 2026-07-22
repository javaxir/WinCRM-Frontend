import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'

export interface SendTelegramToClientDTO {
  clientId: number
  message: string
}

export async function sendTelegramMessageToClient(payload: SendTelegramToClientDTO) {
  const res = await http.post<ApiResponse<unknown>>('/api/telegram/messages/send-to-client', payload)
  return unwrapData(res)
}
