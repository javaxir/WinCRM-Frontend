import { http } from './http'
import { unwrapData } from './api'
import { fetchByGoodsWithListFallback } from './fetchFallbacks'
import type { ApiResponse } from './roles'

export type StockMovementStatus = 'IN' | 'OUT'

export interface StockHistoryResponse {
  id: number
  goodsId: number
  goodsName: string
  warehouseId: number
  warehouseName: string
  stockStatus: StockMovementStatus
  count: number
  balanceAfter: number
  comment: string | null
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export async function fetchAllStockHistories() {
  const res = await http.get<ApiResponse<StockHistoryResponse[]> | StockHistoryResponse[]>(
    '/api/stock-histories',
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchStockHistoryById(id: number) {
  const res = await http.get<ApiResponse<StockHistoryResponse>>(`/api/stock-histories/${id}`)
  return unwrapData(res)
}

export async function fetchStockHistoriesByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<StockHistoryResponse[]> | StockHistoryResponse[]>(
    `/api/stock-histories/by-warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchStockHistoriesByGoods(goodsId: number) {
  return fetchByGoodsWithListFallback(
    async () => {
      const res = await http.get<ApiResponse<StockHistoryResponse[]> | StockHistoryResponse[]>(
        `/api/stock-histories/by-goods/${goodsId}`,
      )
      const data = unwrapData(res)
      return Array.isArray(data) ? data : []
    },
    fetchAllStockHistories,
    goodsId,
  )
}

export async function fetchStockHistoriesByGoodsAndWarehouse(goodsId: number, warehouseId: number) {
  const res = await http.get<ApiResponse<StockHistoryResponse[]> | StockHistoryResponse[]>(
    `/api/stock-histories/by-goods/${goodsId}/warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}
