import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'

export interface DebtOrderInfo {
  saleOrderId: number
  debtSum: number
  orderDate: string
  userId: number | null
  userFullName: string | null
}

export interface DebtorClientResponse {
  clientId: number
  clientFullName: string
  phone: string
  totalDebt: number
  orders: DebtOrderInfo[]
}

export interface DebtNotificationHistoryResponse {
  id: number
  clientId?: number
  clientFullName?: string
  phone?: string
  message?: string
  debtAmount?: number
  totalDebtAmount?: number
  status?: string
  success?: boolean
  errorMessage?: string
  sentAt?: string
  createdAt?: string
}

export interface DebtorsFilter {
  startDate?: string
  endDate?: string
  userId?: number
}

export function sendDebtSmsToClient(clientId: number) {
  return http.post<unknown>(`/api/notifications/debt/send/client/${clientId}`)
}

export function sendDebtSmsToClients(clientIds: number[]) {
  return http.post<unknown>('/api/notifications/debt/send/clients', clientIds)
}

export function sendDebtSmsForOrder(saleOrderId: number) {
  return http.post<unknown>(`/api/notifications/debt/send/order/${saleOrderId}`)
}

export interface TelegramNotificationPayload {
  message: string
}

export interface TelegramNotificationHistoryResponse {
  id: number
  clientId?: number
  clientFullName?: string
  saleOrderId?: number
  chatId?: string
  message?: string
  status?: string
  success?: boolean
  errorMessage?: string
  sentAt?: string
  createdAt?: string
}

export function sendTelegramForOrder(saleOrderId: number, payload: TelegramNotificationPayload) {
  return http.post<unknown>(`/api/notifications/telegram/send/order/${saleOrderId}`, payload)
}

export async function fetchTelegramHistoryByOrder(saleOrderId: number, page = 0, size = 50) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/notifications/telegram/history/order/${saleOrderId}?page=${page}&size=${size}`,
  )
  return unwrapListContent<TelegramNotificationHistoryResponse>(res)
}

export async function fetchDebtors(filter: DebtorsFilter = {}) {
  const params = new URLSearchParams()
  if (filter.startDate) params.set('startDate', filter.startDate)
  if (filter.endDate) params.set('endDate', filter.endDate)
  if (filter.userId && filter.userId > 0) params.set('userId', String(filter.userId))
  const query = params.toString()
  const res = await http.get<ApiResponse<unknown> | unknown>(
    `/api/notifications/debt/debtors${query ? `?${query}` : ''}`,
  )
  return unwrapListContent<DebtorClientResponse>(res)
}

export async function fetchDebtNotificationHistoryByClient(clientId: number, page = 0, size = 50) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/notifications/debt/history/client/${clientId}?page=${page}&size=${size}`,
  )
  return unwrapListContent<DebtNotificationHistoryResponse>(res)
}

export async function fetchDebtNotificationHistory(page = 0, size = 100) {
  const res = await http.get<ApiResponse<unknown>>(`/api/notifications/debt/history?page=${page}&size=${size}`)
  return unwrapListContent<DebtNotificationHistoryResponse>(res)
}
