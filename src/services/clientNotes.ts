import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export type ClientNoteType = 'CALL' | 'MEETING' | 'SMS' | 'PAYMENT_PROMISE' | 'OTHER'
export type ClientNoteReminderStatus = 'NONE' | 'PENDING' | 'DONE' | 'BROKEN'

export interface ClientNoteResponse {
  id: number
  clientId: number
  clientFullName: string
  saleOrderId: number | null
  type: ClientNoteType
  content: string
  interactionDate: string
  reminderDate: string | null
  reminderStatus: ClientNoteReminderStatus
  promisedAmount: number | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface ClientNoteDTO {
  clientId: number
  saleOrderId?: number | null
  type: ClientNoteType
  content: string
  interactionDate: string
  reminderDate?: string | null
  reminderStatus?: ClientNoteReminderStatus
  promisedAmount?: number | null
}

export async function fetchClientNoteById(id: number) {
  const res = await http.get<ApiResponse<ClientNoteResponse>>(`/api/client-notes/${id}`)
  return unwrapData(res)
}

export async function fetchClientNotesByClient(clientId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/client-notes/client/${clientId}`)
  return unwrapListContent<ClientNoteResponse>(res)
}

export async function fetchDueClientNoteReminders() {
  const res = await http.get<ApiResponse<unknown>>('/api/client-notes/reminders/due')
  return unwrapListContent<ClientNoteResponse>(res)
}

export async function createClientNote(payload: ClientNoteDTO) {
  const res = await http.post<ApiResponse<ClientNoteResponse>>('/api/client-notes/create', payload)
  return unwrapData(res)
}

export async function updateClientNote(id: number, payload: ClientNoteDTO) {
  const res = await http.put<ApiResponse<ClientNoteResponse>>(`/api/client-notes/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteClientNote(id: number) {
  return http.delete<unknown>(`/api/client-notes/delete/${id}`)
}

export function updateClientNoteReminderStatus(id: number, status: ClientNoteReminderStatus) {
  return http.patch<unknown>(`/api/client-notes/${id}/reminder-status?status=${status}`)
}
