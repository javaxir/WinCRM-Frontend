import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import { fetchByGoodsWithListFallback } from './fetchFallbacks'
import type { GoodsType } from './goods'
import type { ApiResponse } from './roles'
import type { Status } from './roles'
import { fetchSaleOrdersByClient } from './saleOrders'

export interface SaleOrderItemResponse {
  id: number
  warehouseId: number
  warehouseName: string
  saleOrderId: number
  clientId: number
  clientFullName: string
  goodsId: number
  goodsName: string
  priceCost: number
  priceSelling: number
  width: number | null
  height: number | null
  count: number
  arrivalDate: string
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export type FilterPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'

function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function getFilterDateRange(period: FilterPeriod): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = formatDate(now)

  if (period === 'DAILY') {
    return { startDate: endDate, endDate }
  }

  if (period === 'WEEKLY') {
    const start = new Date(now)
    const day = now.getDay()
    const daysFromMonday = day === 0 ? 6 : day - 1
    start.setDate(now.getDate() - daysFromMonday)
    return { startDate: formatDate(start), endDate }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: formatDate(start), endDate }
}

export interface SaleOrderItemDTO {
  warehouseId: number
  saleOrderId: number
  clientId: number
  goodsId: number
  priceCost: number
  priceSelling: number
  width?: number
  height?: number
  count: number
  arrivalDate: string
  /** Backend qoldiq tekshiruvini o‘tkazib yuborish uchun (SERVICE) */
  goodsType?: GoodsType
  skipStockValidation?: boolean
}

function buildCreateQuery(goodsType?: GoodsType) {
  if (goodsType !== 'SERVICE') return ''
  const params = new URLSearchParams({ skipStockValidation: 'true' })
  return `?${params}`
}

function withServiceFlags(payload: SaleOrderItemDTO, goodsType?: GoodsType): SaleOrderItemDTO {
  if (goodsType !== 'SERVICE') return payload
  return {
    ...payload,
    goodsType: 'SERVICE',
    skipStockValidation: true,
  }
}

export async function fetchSaleOrderItemsByOrder(saleOrderId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-items/sale-order/${saleOrderId}`,
  )
  return unwrapListContent<SaleOrderItemResponse>(res)
}

export async function fetchSaleOrderItemsByOrderPaginated(
  saleOrderId: number,
  page = 0,
  size = 100,
) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-items/sale-order/${saleOrderId}/paginated?page=${page}&size=${size}`,
  )
  return unwrapListContent<SaleOrderItemResponse>(res)
}

export async function fetchAllSaleOrderItemsByOrder(saleOrderId: number) {
  const all: SaleOrderItemResponse[] = []
  let page = 0
  const size = 200
  while (true) {
    try {
      const batch = await fetchSaleOrderItemsByOrderPaginated(saleOrderId, page, size)
      all.push(...batch)
      if (batch.length < size) break
      page += 1
      if (page > 50) break
    } catch {
      if (page === 0) return fetchSaleOrderItemsByOrder(saleOrderId)
      break
    }
  }
  return all
}

export async function fetchSaleOrderItemsByUser(userId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-items/user/${userId}?page=0&size=1000`,
  )
  return unwrapListContent<SaleOrderItemResponse>(res)
}

export async function fetchSaleOrderItemsFilter(
  type: GoodsType,
  startDate: string,
  endDate: string,
  page = 0,
  size = 1000,
) {
  const params = new URLSearchParams({
    type,
    startDate,
    endDate,
    page: String(page),
    size: String(size),
  })
  const res = await http.get<ApiResponse<unknown>>(`/api/sale-order-items/filter?${params}`)
  return unwrapListContent<SaleOrderItemResponse>(res)
}

export async function fetchAllSaleOrderItems() {
  const res = await http.get<ApiResponse<SaleOrderItemResponse[]> | SaleOrderItemResponse[]>(
    '/api/sale-order-items',
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderItemsByClient(clientId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-order-items/client/${clientId}?page=0&size=1000`,
  )
  return unwrapListContent<SaleOrderItemResponse>(res)
}

export async function fetchSaleOrderItemsForClient(clientId: number) {
  const byClient = await fetchSaleOrderItemsByClient(clientId)
  if (byClient.length > 0) return byClient

  const orders = await fetchSaleOrdersByClient(clientId)
  if (orders.length === 0) return []

  const batches = await Promise.all(orders.map((order) => fetchSaleOrderItemsByOrder(order.id)))
  return batches.flat()
}

export async function fetchSaleOrderItemsByGoods(goodsId: number) {
  return fetchByGoodsWithListFallback(
    async () => {
      const res = await http.get<ApiResponse<SaleOrderItemResponse[]> | SaleOrderItemResponse[]>(
        `/api/sale-order-items/goods/${goodsId}`,
      )
      const data = unwrapData(res)
      return Array.isArray(data) ? data : []
    },
    fetchAllSaleOrderItems,
    goodsId,
  )
}

export async function fetchSaleOrderItemsByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<SaleOrderItemResponse[]> | SaleOrderItemResponse[]>(
    `/api/sale-order-items/warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderItemsByArrivalDateRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate })
  const res = await http.get<ApiResponse<SaleOrderItemResponse[]> | SaleOrderItemResponse[]>(
    `/api/sale-order-items/arrival-date-range?${params}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderItemById(id: number) {
  const res = await http.get<ApiResponse<SaleOrderItemResponse>>(`/api/sale-order-items/${id}`)
  return unwrapData(res)
}

export async function createSaleOrderItem(payload: SaleOrderItemDTO, goodsType?: GoodsType) {
  const body = withServiceFlags(payload, goodsType)
  const res = await http.post<ApiResponse<SaleOrderItemResponse>>(
    `/api/sale-order-items/create${buildCreateQuery(goodsType)}`,
    body,
  )
  return unwrapData(res)
}

export async function updateSaleOrderItem(id: number, payload: SaleOrderItemDTO, goodsType?: GoodsType) {
  const body = withServiceFlags(payload, goodsType)
  const res = await http.put<ApiResponse<SaleOrderItemResponse>>(
    `/api/sale-order-items/update/${id}${buildCreateQuery(goodsType)}`,
    body,
  )
  return unwrapData(res)
}

export function deleteSaleOrderItem(id: number) {
  return http.delete<unknown>(`/api/sale-order-items/delete/${id}`)
}
