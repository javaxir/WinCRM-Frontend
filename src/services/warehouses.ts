import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface WarehouseResponse {
  id: number
  name: string
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface WarehouseDTO {
  name: string
}

export async function fetchAllWarehouses() {
  const res = await http.get<ApiResponse<WarehouseResponse[]> | WarehouseResponse[]>('/api/warehouses')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchWarehouseById(id: number) {
  const res = await http.get<ApiResponse<WarehouseResponse>>(`/api/warehouses/${id}`)
  return unwrapData(res)
}

export async function createWarehouse(payload: WarehouseDTO) {
  const res = await http.post<ApiResponse<WarehouseResponse>>('/api/warehouses/create', payload)
  return unwrapData(res)
}

export async function updateWarehouse(id: number, payload: WarehouseDTO) {
  const res = await http.put<ApiResponse<WarehouseResponse>>(`/api/warehouses/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteWarehouse(id: number) {
  return http.delete<unknown>(`/api/warehouses/delete/${id}`)
}
