import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface WarehouseOrderResponse {
  id: number
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  comment: string | null
  arrivalDate: string
  totalSum: number
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface WarehouseOrderDTO {
  supplierId: number
  warehouseId: number
  comment?: string
  arrivalDate: string
}

export async function fetchAllWarehouseOrders() {
  const res = await http.get<ApiResponse<WarehouseOrderResponse[]> | WarehouseOrderResponse[]>(
    '/api/warehouse-orders',
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchWarehouseOrdersBySupplier(supplierId: number, page = 0, size = 1000) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/warehouse-orders/by-supplier/${supplierId}?page=${page}&size=${size}`,
  )
  return unwrapListContent<WarehouseOrderResponse>(res)
}

export async function fetchAllWarehouseOrdersBySupplier(supplierId: number) {
  const all: WarehouseOrderResponse[] = []
  let page = 0
  const size = 500

  while (true) {
    const batch = await fetchWarehouseOrdersBySupplier(supplierId, page, size)
    all.push(...batch)
    if (batch.length < size) break
    page += 1
    if (page > 50) break
  }

  return all
}

export async function fetchWarehouseOrdersByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<WarehouseOrderResponse[]> | WarehouseOrderResponse[]>(
    `/api/warehouse-orders/by-warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchWarehouseOrderById(id: number) {
  const res = await http.get<ApiResponse<WarehouseOrderResponse>>(`/api/warehouse-orders/${id}`)
  return unwrapData(res)
}

export async function createWarehouseOrder(payload: WarehouseOrderDTO) {
  const res = await http.post<ApiResponse<WarehouseOrderResponse>>('/api/warehouse-orders/create', payload)
  return unwrapData(res)
}

export async function updateWarehouseOrder(id: number, payload: WarehouseOrderDTO) {
  const res = await http.put<ApiResponse<WarehouseOrderResponse>>(`/api/warehouse-orders/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteWarehouseOrder(id: number) {
  return http.delete<unknown>(`/api/warehouse-orders/delete/${id}`)
}

/** Order statusini TRANSFERRED qiladi va item'larni Stock'ga qo'shadi. */
export function transferWarehouseOrderToStock(id: number) {
  return http.patch<unknown>(`/api/warehouse-orders/${id}/transfer`)
}
