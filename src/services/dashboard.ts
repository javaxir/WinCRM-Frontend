import { http } from './http'
import { unwrapListContent } from './api'
import type { ApiResponse } from './roles'

export type DashboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type SalesChartPeriod = 'YESTERDAY' | 'TODAY' | 'WEEK' | 'MONTH'

export interface TopGoodsResponse {
  goodsId: number
  goodsName: string
  totalCount: number
  totalAmount: number
}

export interface GoodsGroupSummaryResponse {
  goodsGroupId: number
  goodsGroupName: string
  totalCount: number
  totalAmount: number
}

export interface PaymentTypeSummaryResponse {
  paymentTypeId: number
  paymentTypeName: string
  totalAmount: number
  paymentCount: number
}

export interface ExpenseCategoryInfoResponse {
  categoryId: number
  categoryName: string
  totalAmount: number
}

export interface TopSellerResponse {
  userId: number
  userName: string
  orderCount: number
  totalAmount: number
}

function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function getDashboardDateRange(period: DashboardPeriod): { startDate: string; endDate: string } {
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

export function getSalesChartDateRange(period: SalesChartPeriod): {
  startDate: string
  endDate: string
  granularity: 'hour' | 'day'
} {
  const now = new Date()
  const endDate = formatDate(now)

  if (period === 'YESTERDAY') {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const d = formatDate(yesterday)
    return { startDate: d, endDate: d, granularity: 'hour' }
  }

  if (period === 'TODAY') {
    return { startDate: endDate, endDate, granularity: 'hour' }
  }

  if (period === 'WEEK') {
    const start = new Date(now)
    const day = now.getDay()
    const daysFromMonday = day === 0 ? 6 : day - 1
    start.setDate(now.getDate() - daysFromMonday)
    return { startDate: formatDate(start), endDate, granularity: 'day' }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: formatDate(start), endDate, granularity: 'day' }
}

export function getDashboardDateTimeRange(period: DashboardPeriod): { fromDate: string; toDate: string } {
  const { startDate, endDate } = getDashboardDateRange(period)
  return {
    fromDate: `${startDate}T00:00:00`,
    toDate: `${endDate}T23:59:59`,
  }
}

async function fetchDashboardList<T>(path: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate })
  const res = await http.get<ApiResponse<unknown> | unknown>(`${path}?${params}`)
  return unwrapListContent<T>(res)
}

export function fetchTopGoodsByQuantity(startDate: string, endDate: string) {
  return fetchDashboardList<TopGoodsResponse>('/api/dashboard/top-goods/by-quantity', startDate, endDate)
}

export function fetchTopGoodsByAmount(startDate: string, endDate: string) {
  return fetchDashboardList<TopGoodsResponse>('/api/dashboard/top-goods/by-amount', startDate, endDate)
}

export function fetchTopSellers(startDate: string, endDate: string) {
  return fetchDashboardList<TopSellerResponse>('/api/dashboard/top-sellers', startDate, endDate)
}

export function fetchGoodsGroupSummary(startDate: string, endDate: string) {
  return fetchDashboardList<GoodsGroupSummaryResponse>('/api/dashboard/goods-group-summary', startDate, endDate)
}

async function fetchDashboardPaymentsList<T>(path: string, fromDate: string, toDate: string) {
  const params = new URLSearchParams({ fromDate, toDate })
  const res = await http.get<ApiResponse<unknown> | unknown>(`${path}?${params}`)
  return unwrapListContent<T>(res)
}

export function fetchPaymentsByType(fromDate: string, toDate: string) {
  return fetchDashboardPaymentsList<PaymentTypeSummaryResponse>('/api/dashboard/payments/by-type', fromDate, toDate)
}

export interface DailyPaymentResponse {
  date?: string
  paymentDate?: string
  day?: string
  paymentTypeId?: number
  paymentTypeName?: string
  totalAmount?: number
  amount?: number
  paymentCount?: number
  [key: string]: unknown
}

export function fetchDailyPayments(fromDate: string, toDate: string) {
  return fetchDashboardPaymentsList<DailyPaymentResponse>(
    '/api/dashboard/payments/daily',
    fromDate,
    toDate,
  )
}

export function fetchExpenseInfoByCategory(startDate: string, endDate: string) {
  return fetchDashboardList<ExpenseCategoryInfoResponse>('/api/dashboard/expense/info', startDate, endDate)
}

export async function fetchDashboardData(period: DashboardPeriod) {
  const { startDate, endDate } = getDashboardDateRange(period)
  return fetchDashboardDataByRange(startDate, endDate)
}

export async function fetchDashboardDataByRange(startDate: string, endDate: string) {
  const fromDate = `${startDate}T00:00:00`
  const toDate = `${endDate}T23:59:59`
  const [
    topByQuantity,
    topByAmount,
    groupSummary,
    paymentsByType,
    topSellersResult,
    expensesByCategory,
    dailyPayments,
  ] = await Promise.all([
    fetchTopGoodsByQuantity(startDate, endDate),
    fetchTopGoodsByAmount(startDate, endDate),
    fetchGoodsGroupSummary(startDate, endDate),
    fetchPaymentsByType(fromDate, toDate),
    fetchTopSellers(startDate, endDate).catch(() => [] as TopSellerResponse[]),
    fetchExpenseInfoByCategory(startDate, endDate).catch(() => [] as ExpenseCategoryInfoResponse[]),
    fetchDailyPayments(fromDate, toDate).catch(() => [] as DailyPaymentResponse[]),
  ])
  return {
    startDate,
    endDate,
    topByQuantity,
    topByAmount,
    topSellers: topSellersResult,
    groupSummary,
    paymentsByType,
    expensesByCategory,
    dailyPayments,
  }
}
