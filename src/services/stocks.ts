import { http } from './http'
import { unwrapData } from './api'
import { fetchByGoodsWithListFallback } from './fetchFallbacks'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface StockResponse {
  id: number
  goodsId: number
  goodsName: string
  warehouseId: number
  warehouseName: string
  count: number
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export async function fetchAllStocks() {
  const res = await http.get<ApiResponse<StockResponse[]> | StockResponse[]>('/api/stocks')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchStockById(id: number) {
  const res = await http.get<ApiResponse<StockResponse>>(`/api/stocks/${id}`)
  return unwrapData(res)
}

export async function fetchStocksByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<StockResponse[]> | StockResponse[]>(
    `/api/stocks/by-warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchStocksByGoods(goodsId: number) {
  return fetchByGoodsWithListFallback(
    async () => {
      const res = await http.get<ApiResponse<StockResponse[]> | StockResponse[]>(
        `/api/stocks/by-goods/${goodsId}`,
      )
      const data = unwrapData(res)
      return Array.isArray(data) ? data : []
    },
    fetchAllStocks,
    goodsId,
  )
}

export function deleteStock(id: number) {
  return http.delete<unknown>(`/api/stocks/delete/${id}`)
}
