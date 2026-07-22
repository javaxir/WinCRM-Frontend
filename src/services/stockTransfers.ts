import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export interface StockTransferResponse {
  id: number
  goodsId: number
  goodsName: string
  fromWarehouseId: number
  fromWarehouseName: string
  toWarehouseId: number
  toWarehouseName: string
  count: number
  comment: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface StockTransferDTO {
  goodsId: number
  fromWarehouseId: number
  toWarehouseId: number
  count: number
  comment?: string
}

export async function fetchAllStockTransfers() {
  const res = await http.get<ApiResponse<unknown>>('/api/stock-transfers')
  return unwrapListContent<StockTransferResponse>(res)
}

export async function fetchStockTransferById(id: number) {
  const res = await http.get<ApiResponse<StockTransferResponse>>(`/api/stock-transfers/${id}`)
  return unwrapData(res)
}

export async function fetchStockTransfersByGoods(goodsId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/stock-transfers/by-goods/${goodsId}`)
  return unwrapListContent<StockTransferResponse>(res)
}

export async function fetchStockTransfersByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/stock-transfers/by-warehouse/${warehouseId}`,
  )
  return unwrapListContent<StockTransferResponse>(res)
}

export async function createStockTransfer(payload: StockTransferDTO) {
  const res = await http.post<ApiResponse<StockTransferResponse>>('/api/stock-transfers', payload)
  return unwrapData(res)
}

export function deleteStockTransfer(id: number) {
  return http.delete<unknown>(`/api/stock-transfers/delete/${id}`)
}
