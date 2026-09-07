import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export interface SaleOrderWasteDTO {
  saleOrderId: number
  goodsId: number
  quantity: number
  width?: number
  height?: number
  comment?: string
}

export interface SaleOrderWasteResponse {
  id: number
  saleOrderId: number
  goodsId: number
  goodsName: string | null
  unitName: string | null
  quantity: number
  width: number | null
  height: number | null
  comment: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdBy: number | null
}

export interface SaleOrderWasteSummaryResponse {
  goodsId: number
  goodsName: string | null
  totalQuantity: number
}

export async function fetchAllSaleOrderWastes(page = 0, size = 100) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-wastes?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SaleOrderWasteResponse>(res)
}

export async function fetchSaleOrderWasteById(id: number) {
  const res = await http.get<ApiResponse<SaleOrderWasteResponse>>(`/api/sale-order-wastes/${id}`)
  return unwrapData(res)
}

export async function fetchSaleOrderWastesByOrder(saleOrderId: number) {
  const res = await http.get<ApiResponse<SaleOrderWasteResponse[]> | SaleOrderWasteResponse[]>(
    `/api/sale-order-wastes/sale-order/${saleOrderId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data.filter((row) => row.status !== 'DELETED') : []
}

export async function fetchSaleOrderWastesByOrderPaged(
  saleOrderId: number,
  page = 0,
  size = 50,
) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-wastes/sale-order/${saleOrderId}/paged?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SaleOrderWasteResponse>(res)
}

export async function fetchSaleOrderWasteTotal(saleOrderId: number) {
  const res = await http.get<ApiResponse<number> | number>(
    `/api/sale-order-wastes/sale-order/${saleOrderId}/total`,
  )
  const data = unwrapData(res)
  return typeof data === 'number' ? data : Number(data) || 0
}

export async function fetchSaleOrderWasteSummaryByOrder(saleOrderId: number) {
  const res = await http.get<
    ApiResponse<SaleOrderWasteSummaryResponse[]> | SaleOrderWasteSummaryResponse[]
  >(`/api/sale-order-wastes/sale-order/${saleOrderId}/summary`)
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderWasteSummary() {
  const res = await http.get<
    ApiResponse<SaleOrderWasteSummaryResponse[]> | SaleOrderWasteSummaryResponse[]
  >('/api/sale-order-wastes/summary')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderWastesByGoods(goodsId: number, page = 0, size = 100) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-wastes/goods/${goodsId}?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SaleOrderWasteResponse>(res)
}

export async function createSaleOrderWaste(payload: SaleOrderWasteDTO) {
  const res = await http.post<ApiResponse<SaleOrderWasteResponse>>(
    '/api/sale-order-wastes/create',
    payload,
  )
  return unwrapData(res)
}

export async function updateSaleOrderWaste(id: number, payload: SaleOrderWasteDTO) {
  const res = await http.put<ApiResponse<SaleOrderWasteResponse>>(
    `/api/sale-order-wastes/update/${id}`,
    payload,
  )
  return unwrapData(res)
}

export function deleteSaleOrderWaste(id: number) {
  return http.delete<unknown>(`/api/sale-order-wastes/delete/${id}`)
}
