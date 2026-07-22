import type { AuditLog } from '@/services/audit'
import type { PaymentResponse } from '@/services/payments'
import type { SaleOrderItemResponse } from '@/services/saleOrderItems'
import type { SaleOrderResponse } from '@/services/saleOrders'
import type { UserResponse } from '@/services/users'
import { formatIsoDate } from '@/utils/dateRange'
import { calcWindowAreaM2 } from '@/utils/saleOrderMeta'
import { buildUserReportSummaries } from '@/utils/userReport'

export function getPreviousPeriodRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return { startDate: formatIsoDate(prevStart), endDate: formatIsoDate(prevEnd), days }
}

export function countPeriodDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
}

export interface MetricDelta {
  current: number
  previous: number
  delta: number
  percent: number | null
}

export function calcMetricDelta(current: number, previous: number): MetricDelta {
  const delta = current - previous
  let percent: number | null = null
  if (previous !== 0) {
    percent = (delta / previous) * 100
  } else if (current > 0) {
    percent = 100
  }
  return { current, previous, delta, percent }
}

export interface TopClientRow {
  clientId: number
  clientName: string
  orderCount: number
  totalAmount: number
}

export function buildTopClients(orders: SaleOrderResponse[], limit = 10): TopClientRow[] {
  const map = new Map<number, TopClientRow>()
  for (const order of orders) {
    if (!order.clientId) continue
    const existing = map.get(order.clientId) ?? {
      clientId: order.clientId,
      clientName: order.clientFullName || `#${order.clientId}`,
      orderCount: 0,
      totalAmount: 0,
    }
    existing.orderCount += 1
    existing.totalAmount += order.totalSum
    map.set(order.clientId, existing)
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, limit)
}

export interface TopProductRow {
  goodsId: number
  name: string
  quantity: number
  amount: number
}

export function buildTopProducts(items: SaleOrderItemResponse[], limit = 10): TopProductRow[] {
  const map = new Map<number, TopProductRow>()
  for (const item of items) {
    const existing = map.get(item.goodsId) ?? {
      goodsId: item.goodsId,
      name: item.goodsName,
      quantity: 0,
      amount: 0,
    }
    existing.quantity += item.count
    existing.amount += item.priceSelling * item.count
    map.set(item.goodsId, existing)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

export interface WindowStats {
  windowItemCount: number
  windowOrderCount: number
  totalAreaM2: number
  avgAreaM2: number
  hasEnoughData: boolean
}

export function buildWindowStats(items: SaleOrderItemResponse[]): WindowStats {
  const windowItems = items.filter((item) => calcWindowAreaM2(item.width, item.height) != null)
  const totalAreaM2 = windowItems.reduce((sum, item) => {
    const area = calcWindowAreaM2(item.width, item.height)!
    return sum + area * item.count
  }, 0)
  const windowItemCount = windowItems.reduce((sum, item) => sum + item.count, 0)
  const orderIdsWithWindows = new Set(windowItems.map((item) => item.saleOrderId))
  return {
    windowItemCount,
    windowOrderCount: orderIdsWithWindows.size,
    totalAreaM2,
    avgAreaM2: windowItemCount > 0 ? totalAreaM2 / windowItemCount : 0,
    hasEnoughData: windowItems.length >= 3,
  }
}

export interface ProfitStats {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginPercent: number
}

export function buildProfitStats(items: SaleOrderItemResponse[]): ProfitStats {
  let totalRevenue = 0
  let totalCost = 0
  for (const item of items) {
    totalRevenue += item.priceSelling * item.count
    totalCost += item.priceCost * item.count
  }
  const totalProfit = totalRevenue - totalCost
  const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  return { totalRevenue, totalCost, totalProfit, marginPercent }
}

export interface WarehouseStatRow {
  warehouseName: string
  orderCount: number
  totalAmount: number
}

export function buildWarehouseStats(orders: SaleOrderResponse[]): WarehouseStatRow[] {
  const map = new Map<string, WarehouseStatRow>()
  for (const order of orders) {
    const name = order.warehouseName || '—'
    const existing = map.get(name) ?? { warehouseName: name, orderCount: 0, totalAmount: 0 }
    existing.orderCount += 1
    existing.totalAmount += order.totalSum
    map.set(name, existing)
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount)
}

export interface ActivityStats {
  lastOrderDate: string | null
  dailyAvgOrders: number
  busiestDayOfWeek: number | null
  busiestHour: number | null
  hourlyCounts: number[]
}

export function buildActivityStats(orders: SaleOrderResponse[], periodDays: number): ActivityStats {
  if (orders.length === 0) {
    return {
      lastOrderDate: null,
      dailyAvgOrders: 0,
      busiestDayOfWeek: null,
      busiestHour: null,
      hourlyCounts: Array.from({ length: 24 }, () => 0),
    }
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
  )
  const dayCounts = Array.from({ length: 7 }, () => 0)
  const hourlyCounts = Array.from({ length: 24 }, () => 0)

  for (const order of orders) {
    const date = new Date(order.orderDate)
    dayCounts[date.getDay()] += 1
    hourlyCounts[date.getHours()] += 1
  }

  const maxDayCount = Math.max(...dayCounts)
  const maxHourCount = Math.max(...hourlyCounts)

  return {
    lastOrderDate: sorted[0]?.orderDate ?? null,
    dailyAvgOrders: periodDays > 0 ? orders.length / periodDays : orders.length,
    busiestDayOfWeek: maxDayCount > 0 ? dayCounts.indexOf(maxDayCount) : null,
    busiestHour: maxHourCount > 0 ? hourlyCounts.indexOf(maxHourCount) : null,
    hourlyCounts,
  }
}

export interface SellerRankInfo {
  rank: number
  totalSellers: number
  sharePercent: number
  topSellers: { userId: number; userName: string; totalAmount: number; orderCount: number }[]
}

export function buildSellerRank(
  users: UserResponse[],
  orders: SaleOrderResponse[],
  userId: number,
  topN = 5,
): SellerRankInfo {
  const summaries = buildUserReportSummaries(users, orders)
  const active = summaries.filter((row) => row.orderCount > 0)
  const idx = active.findIndex((row) => row.userId === userId)
  const userSummary = active[idx]
  const grandTotal = active.reduce((sum, row) => sum + row.totalAmount, 0)

  return {
    rank: idx >= 0 ? idx + 1 : 0,
    totalSellers: active.length,
    sharePercent: grandTotal > 0 && userSummary ? (userSummary.totalAmount / grandTotal) * 100 : 0,
    topSellers: active.slice(0, topN).map((row) => ({
      userId: row.userId,
      userName: row.userName,
      totalAmount: row.totalAmount,
      orderCount: row.orderCount,
    })),
  }
}

export interface PaymentByOrderRow {
  saleOrderId: number
  clientName: string
  orderDate: string
  orderTotal: number
  paidTotal: number
  payments: PaymentResponse[]
}

export function groupPaymentsByOrder(
  orders: SaleOrderResponse[],
  payments: PaymentResponse[],
): PaymentByOrderRow[] {
  const byOrder = new Map<number, PaymentResponse[]>()
  for (const payment of payments) {
    if (!payment.saleOrderId) continue
    const list = byOrder.get(payment.saleOrderId) ?? []
    list.push(payment)
    byOrder.set(payment.saleOrderId, list)
  }

  return orders
    .map((order) => {
      const orderPayments = byOrder.get(order.id) ?? []
      const paidTotal = orderPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
      return {
        saleOrderId: order.id,
        clientName: order.clientFullName || '—',
        orderDate: order.orderDate,
        orderTotal: order.totalSum,
        paidTotal,
        payments: orderPayments.sort(
          (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
        ),
      }
    })
    .filter((row) => row.payments.length > 0)
    .sort((a, b) => b.paidTotal - a.paidTotal)
}

export function filterAuditLogsForUser(
  logs: AuditLog[],
  username: string | undefined,
  orderIds: Set<number>,
): AuditLog[] {
  if (!username) return []
  return logs
    .filter((log) => {
      if (log.username !== username) return false
      const entity = log.entity?.toLowerCase() ?? ''
      const isOrderRelated =
        entity.includes('sale') ||
        entity.includes('order') ||
        [...orderIds].some((id) => log.description?.includes(String(id)))
      return isOrderRelated
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100)
}

export async function loadItemsForOrders(orderIds: number[], fetchByOrder: (id: number) => Promise<SaleOrderItemResponse[]>) {
  if (orderIds.length === 0) return []
  const batches = await Promise.all(orderIds.map((id) => fetchByOrder(id)))
  return batches.flat()
}

export async function loadPaymentsForOrders(orderIds: number[], fetchByOrder: (id: number) => Promise<PaymentResponse[]>) {
  if (orderIds.length === 0) return []
  const batches = await Promise.all(orderIds.map((id) => fetchByOrder(id)))
  return batches.flat()
}
