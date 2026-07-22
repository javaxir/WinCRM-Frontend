import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface ClientResponse {
  id: number
  fullName: string
  inn: string | null
  phone: string
  additionalPhone: string | null
  address: string
  bankName: string | null
  mfo: string | null
  accountNumber: string | null
  description: string | null
  clientGroupId: number | null
  clientGroupName: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface ClientDTO {
  fullName: string
  phone: string
  address: string
  clientGroupId: number
  inn?: string
  additionalPhone?: string
  bankName?: string
  mfo?: string
  accountNumber?: string
  description?: string
}

export async function fetchAllClients(clientGroupId?: number) {
  const query = clientGroupId ? `?clientGroupId=${clientGroupId}` : ''
  const res = await http.get<ApiResponse<ClientResponse[]> | ClientResponse[]>(`/api/clients${query}`)
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchClientById(id: number) {
  const res = await http.get<ApiResponse<ClientResponse>>(`/api/clients/${id}`)
  return unwrapData(res)
}

export async function createClient(payload: ClientDTO) {
  const res = await http.post<ApiResponse<ClientResponse>>('/api/clients/create', payload)
  return unwrapData(res)
}

export async function updateClient(id: number, payload: ClientDTO) {
  const res = await http.put<ApiResponse<ClientResponse>>(`/api/clients/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteClient(id: number) {
  return http.delete<unknown>(`/api/clients/delete/${id}`)
}
