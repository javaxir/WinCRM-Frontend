import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface ClientGroupResponse {
  id: number
  name: string
  status: Status
  createdUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientGroupDTO {
  name: string
}

export async function fetchAllClientGroups() {
  const res = await http.get<ApiResponse<ClientGroupResponse[]> | ClientGroupResponse[]>('/api/client-groups')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchClientGroupById(id: number) {
  const res = await http.get<ApiResponse<ClientGroupResponse>>(`/api/client-groups/${id}`)
  return unwrapData(res)
}

export async function createClientGroup(payload: ClientGroupDTO) {
  const res = await http.post<ApiResponse<ClientGroupResponse>>('/api/client-groups/create', payload)
  return unwrapData(res)
}

export async function updateClientGroup(id: number, payload: ClientGroupDTO) {
  const res = await http.put<ApiResponse<ClientGroupResponse>>(`/api/client-groups/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteClientGroup(id: number) {
  return http.delete<unknown>(`/api/client-groups/delete/${id}`)
}
