import { http } from './http'

export type Status = 'ACTIVE' | 'DISABLED' | 'DELETED'

/**
 * Backend barcha /api/roles endpointlarida javobni shu ko'rinishda o'raydi:
 * { "message": "...", "data": <actual payload> }
 */
export interface ApiResponse<T> {
  message: string
  data: T
}

export interface RoleResponse {
  id: number
  name: string
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface RoleDTO {
  name: string
}

export interface PermissionsResponse {
  id: number
  name: string
}

export async function fetchAllRoles() {
  const res = await http.get<ApiResponse<RoleResponse[]>>('/api/roles')
  return res.data
}

export async function fetchRoleById(id: number) {
  const res = await http.get<ApiResponse<RoleResponse>>(`/api/roles/${id}`)
  return res.data
}

export async function createRole(payload: RoleDTO) {
  const res = await http.post<ApiResponse<RoleResponse>>('/api/roles/create', payload)
  return res.data
}

export async function updateRole(id: number, payload: RoleDTO) {
  const res = await http.put<ApiResponse<RoleResponse>>(`/api/roles/update/${id}`, payload)
  return res.data
}

export function deleteRole(id: number) {
  return http.delete<unknown>(`/api/roles/delete/${id}`)
}

export async function fetchAllPermissions() {
  const res = await http.get<ApiResponse<PermissionsResponse[]>>('/api/roles/all/permissions')
  return res.data
}

export async function fetchPermissionsByRoleId(roleId: number) {
  const res = await http.get<ApiResponse<PermissionsResponse[]>>(`/api/roles/${roleId}/permissions`)
  return res.data
}

export function assignPermissionToRole(roleId: number, permissionId: number) {
  return http.post<unknown>(`/api/roles/${roleId}/permissions/${permissionId}`)
}

export function removePermissionFromRole(roleId: number, permissionId: number) {
  return http.delete<unknown>(`/api/roles/${roleId}/permissions/${permissionId}`)
}
