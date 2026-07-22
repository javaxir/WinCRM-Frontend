import { http } from './http'
import { unwrapData } from './api'
import { fetchByGoodsWithListFallback } from './fetchFallbacks'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface WarehouseOrderItemResponse {
  id: number
  warehouseId: number
  warehouseName: string
  warehouseOrderId: number
  supplierId: number
  supplierName: string
  goodsId: number
  goodsName: string
  priceCost: number
  priceSelling: number
  weight: number | null
  height: number | null
  count: number
  arrivalDate: string
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface WarehouseOrderItemDTO {
  warehouseId: number
  warehouseOrderId: number
  supplierId: number
  goodsId: number
  priceCost: number
  priceSelling: number
  weight?: number
  height?: number
  count: number
  arrivalDate: string
}

export async function fetchAllWarehouseOrderItems() {
  const res = await http.get<ApiResponse<WarehouseOrderItemResponse[]> | WarehouseOrderItemResponse[]>(
    '/api/warehouse-order-items',
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

import { fetchAllWarehouseOrdersBySupplier } from './warehouseOrders'

export async function fetchWarehouseOrderItemsForSupplier(supplierId: number) {
  const orders = await fetchAllWarehouseOrdersBySupplier(supplierId)
  if (!orders.length) return []
  const batches = await Promise.all(orders.map((o) => fetchWarehouseOrderItemsByOrder(o.id)))
  return batches.flat()
}

export async function fetchWarehouseOrderItemsByOrder(warehouseOrderId: number) {
  const res = await http.get<ApiResponse<WarehouseOrderItemResponse[]> | WarehouseOrderItemResponse[]>(
    `/api/warehouse-order-items/by-order/${warehouseOrderId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchWarehouseOrderItemsByGoods(goodsId: number) {
  return fetchByGoodsWithListFallback(
    async () => {
      const res = await http.get<ApiResponse<WarehouseOrderItemResponse[]> | WarehouseOrderItemResponse[]>(
        `/api/warehouse-order-items/goods/${goodsId}`,
      )
      const data = unwrapData(res)
      return Array.isArray(data) ? data : []
    },
    fetchAllWarehouseOrderItems,
    goodsId,
  )
}

export async function fetchWarehouseOrderItemById(id: number) {
  const res = await http.get<ApiResponse<WarehouseOrderItemResponse>>(`/api/warehouse-order-items/${id}`)
  return unwrapData(res)
}

export async function createWarehouseOrderItem(payload: WarehouseOrderItemDTO) {
  const res = await http.post<ApiResponse<WarehouseOrderItemResponse>>(
    '/api/warehouse-order-items/create',
    payload,
  )
  return unwrapData(res)
}

export async function updateWarehouseOrderItem(id: number, payload: WarehouseOrderItemDTO) {
  const res = await http.put<ApiResponse<WarehouseOrderItemResponse>>(
    `/api/warehouse-order-items/update/${id}`,
    payload,
  )
  return unwrapData(res)
}

export function deleteWarehouseOrderItem(id: number) {
  return http.delete<unknown>(`/api/warehouse-order-items/delete/${id}`)
}
