import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

function normalizeDateTimeParam(value: string, boundary: 'start' | 'end'): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return value
  const dateOnly = value.includes('T') ? value.slice(0, 10) : value
  return boundary === 'start' ? `${dateOnly}T00:00:00` : `${dateOnly}T23:59:59`
}

import type { SaleOrderAttachment, SaleOrderActivityEntry } from '@/utils/saleOrderMeta'
import { parseSaleOrderComment } from '@/utils/saleOrderMeta'

export type SaleOrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface SaleOrderResponse {
  id: number
  clientId: number | null
  clientFullName: string | null
  warehouseId: number
  warehouseName: string
  userId: number | null
  userFullName: string | null
  comment: string | null
  orderDate: string
  plannedReadyDate?: string | null
  plannedDeliveryDate?: string | null
  originalTotalSum?: number | null
  discountType?: DiscountType | null
  discountValue?: number | null
  discountAmount?: number | null
  totalSum: number
  paidSum: number
  debtSum: number
  status: Status
  orderStatus: SaleOrderStatus
  createdAt: string
  updatedAt: string
  createdUsername: string | null
  createdBy?: number | null
  /** Parsed from comment metadata block */
  userComment?: string | null
  deliveryDate?: string | null
  attachments?: SaleOrderAttachment[]
  cancelReason?: string | null
  activityLog?: SaleOrderActivityEntry[]
}

export interface SaleOrderDTO {
  clientId?: number
  warehouseId: number
  userId?: number
  comment?: string
  orderDate: string
  plannedReadyDate?: string
  plannedDeliveryDate?: string
  totalSum?: number
  discountType?: DiscountType
  discountValue?: number
  deliveryDate?: string
}

export async function fetchAllSaleOrders() {
  const res = await http.get<ApiResponse<SaleOrderResponse[]> | SaleOrderResponse[]>('/api/sale-orders')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrdersByClient(clientId: number) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/sale-orders/client/${clientId}?page=0&size=1000`,
  )
  return unwrapListContent<SaleOrderResponse>(res)
}

export async function fetchSaleOrdersByUser(userId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/sale-orders/user/${userId}?page=0&size=1000`)
  return unwrapListContent<SaleOrderResponse>(res)
}

export async function fetchSaleOrdersByWarehouse(warehouseId: number) {
  const res = await http.get<ApiResponse<SaleOrderResponse[]> | SaleOrderResponse[]>(
    `/api/sale-orders/warehouse/${warehouseId}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrdersByDateRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    startDate: normalizeDateTimeParam(startDate, 'start'),
    endDate: normalizeDateTimeParam(endDate, 'end'),
  })
  const res = await http.get<ApiResponse<SaleOrderResponse[]> | SaleOrderResponse[]>(
    `/api/sale-orders/date-range?${params}`,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchSaleOrderById(id: number) {
  const res = await http.get<ApiResponse<SaleOrderResponse>>(`/api/sale-orders/${id}`)
  const order = unwrapData(res)
  return normalizeSaleOrder(order)
}

function normalizeSaleOrder(order: SaleOrderResponse): SaleOrderResponse {
  const raw = order as SaleOrderResponse & {
    description?: string | null
    orderComment?: string | null
    deliveryDate?: string | null
    plannedDeliveryDate?: string | null
  }
  const rawComment = raw.comment ?? raw.description ?? raw.orderComment
  const { comment: userComment, meta } = parseSaleOrderComment(
    typeof rawComment === 'string' ? rawComment : null,
  )
  const deliveryDate = raw.deliveryDate ?? raw.plannedDeliveryDate ?? meta.deliveryDate ?? null
  return {
    ...order,
    comment: typeof rawComment === 'string' && rawComment.trim() ? rawComment.trim() : null,
    userComment,
    plannedReadyDate: order.plannedReadyDate ?? null,
    plannedDeliveryDate: order.plannedDeliveryDate ?? null,
    deliveryDate,
    attachments: meta.attachments ?? [],
    cancelReason: meta.cancelReason ?? null,
    activityLog: meta.activity ?? [],
  }
}

export async function createSaleOrder(payload: SaleOrderDTO) {
  const res = await http.post<ApiResponse<SaleOrderResponse>>('/api/sale-orders/create', payload)
  return normalizeSaleOrder(unwrapData(res))
}

export async function updateSaleOrder(id: number, payload: SaleOrderDTO) {
  const res = await http.put<ApiResponse<SaleOrderResponse>>(`/api/sale-orders/update/${id}`, payload)
  return unwrapData(res)
}

export function changeSaleOrderStatus(id: number, salesOrderStatus: SaleOrderStatus) {
  return http.patch<unknown>(`/api/sale-orders/${id}/status?salesOrderStatus=${salesOrderStatus}`)
}

export function deleteSaleOrder(id: number) {
  return http.delete<unknown>(`/api/sale-orders/delete/${id}`)
}

export interface ApplyDiscountDTO {
  discountType: DiscountType
  discountValue: number
}

export interface SaleOrderDiscountHistoryResponse {
  id: number
  saleOrderId: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  previousDiscountAmount: number
  originalTotalSum: number
  totalSumAfter: number
  createdAt: string
  createdBy: number | null
}

export interface SaleOrderHistoryResponse {
  id: number
  saleOrderId: number
  fromStatus: SaleOrderStatus | null
  toStatus: SaleOrderStatus
  changedByUserId: number | null
  changedByUserFullName: string | null
  comment: string | null
  changedAt: string
}

export async function applySaleOrderDiscount(id: number, payload: ApplyDiscountDTO) {
  const res = await http.patch<ApiResponse<SaleOrderResponse>>(
    `/api/sale-orders/${id}/discount`,
    payload,
  )
  return normalizeSaleOrder(unwrapData(res))
}

export async function fetchSaleOrderDiscountHistory(id: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/sale-orders/${id}/discount-history`)
  return unwrapListContent<SaleOrderDiscountHistoryResponse>(res)
}

export async function fetchSaleOrderStatusHistory(id: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/sale-orders/${id}/history`)
  return unwrapListContent<SaleOrderHistoryResponse>(res)
}
