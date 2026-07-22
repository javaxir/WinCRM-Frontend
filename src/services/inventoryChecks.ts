import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export type InventoryCheckStatus = 'IN_PROGRESS' | 'CONFIRMED' | 'CANCELLED'

export interface InventoryCheckItemResponse {
  id: number
  goodsId: number
  goodsName: string
  systemCount: number
  actualCount: number | null
  difference: number | null
  comment: string | null
}

export interface InventoryCheckResponse {
  id: number
  warehouseId: number
  warehouseName: string
  checkStatus: InventoryCheckStatus
  comment: string | null
  confirmedAt: string | null
  confirmedUsername: string | null
  items: InventoryCheckItemResponse[]
  status: Status
  createdAt: string
  createdUsername: string | null
}

export interface StartInventoryCheckDTO {
  warehouseId: number
  comment?: string
}

export interface UpdateInventoryCheckItemDTO {
  actualCount: number
  comment?: string
}

export async function fetchAllInventoryChecks() {
  const res = await http.get<ApiResponse<unknown>>('/api/inventory-checks')
  return unwrapListContent<InventoryCheckResponse>(res)
}

export async function fetchInventoryCheckById(id: number) {
  const res = await http.get<ApiResponse<InventoryCheckResponse>>(`/api/inventory-checks/${id}`)
  return unwrapData(res)
}

export async function fetchInventoryChecksByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/inventory-checks/by-warehouse/${warehouseId}`,
  )
  return unwrapListContent<InventoryCheckResponse>(res)
}

export async function startInventoryCheck(payload: StartInventoryCheckDTO) {
  const res = await http.post<ApiResponse<InventoryCheckResponse>>(
    '/api/inventory-checks/start',
    payload,
  )
  return unwrapData(res)
}

export async function updateInventoryCheckItem(
  inventoryCheckId: number,
  itemId: number,
  payload: UpdateInventoryCheckItemDTO,
) {
  const res = await http.put<ApiResponse<InventoryCheckItemResponse>>(
    `/api/inventory-checks/${inventoryCheckId}/items/${itemId}`,
    payload,
  )
  return unwrapData(res)
}

export function confirmInventoryCheck(id: number) {
  return http.post<unknown>(`/api/inventory-checks/${id}/confirm`)
}

export function cancelInventoryCheck(id: number) {
  return http.post<unknown>(`/api/inventory-checks/${id}/cancel`)
}

export function deleteInventoryCheck(id: number) {
  return http.delete<unknown>(`/api/inventory-checks/delete/${id}`)
}
