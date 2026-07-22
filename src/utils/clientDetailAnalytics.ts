import type { AuditLog } from '@/services/audit'
import type { PaymentResponse } from '@/services/payments'
import type { DebtNotificationHistoryResponse } from '@/services/notifications'
import type { SaleOrderItemResponse } from '@/services/saleOrderItems'
import type { SaleOrderResponse } from '@/services/saleOrders'
import { calcWindowAreaM2 } from '@/utils/saleOrderMeta'

export type ClientSegment = 'VIP' | 'RISKY' | 'DORMANT' | 'REGULAR'

export interface DebtAgingBucket {
  key: '0-30' | '31-60' | '61-90' | '90+'
  labelKey: string
  amount: number
  orderCount: number
}

export interface ProfitStats {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginPercent: number
}

export interface WindowStats {
  windowItemCount: number
  windowOrderCount: number
  totalAreaM2: number
  avgAreaM2: number
}

export interface SellerStatRow {
  userId: number
  userName: string
  orderCount: number
  totalAmount: number
}

export interface WarehouseStatRow {
  warehouseName: string
  orderCount: number
  totalAmount: number
}

export type ActRowType = 'order' | 'payment'

export interface ActRow {
  id: string
  type: ActRowType
  date: string
  orderId?: number
  paymentId?: number
  description: string
  debit: number
  credit: number
  balance?: number
  orderStatus?: string
  warehouseName?: string
}

export type TimelineEntryType = 'order' | 'payment' | 'sms' | 'audit'

export interface TimelineEntry {
  id: string
  type: TimelineEntryType
  at: string
  title: string
  description: string
  link?: string
}

export function buildDebtAging(orders: SaleOrderResponse[]): DebtAgingBucket[] {
  const buckets: DebtAgingBucket[] = [
    { key: '0-30', labelKey: 'clientDetail.debtAging0_30', amount: 0, orderCount: 0 },
    { key: '31-60', labelKey: 'clientDetail.debtAging31_60', amount: 0, orderCount: 0 },
    { key: '61-90', labelKey: 'clientDetail.debtAging61_90', amount: 0, orderCount: 0 },
    { key: '90+', labelKey: 'clientDetail.debtAging90Plus', amount: 0, orderCount: 0 },
  ]

  const now = Date.now()
  for (const order of orders) {
    if (order.debtSum <= 0) continue
    const ageDays = Math.floor((now - new Date(order.orderDate).getTime()) / 86_400_000)
    let idx = 0
    if (ageDays <= 30) idx = 0
    else if (ageDays <= 60) idx = 1
    else if (ageDays <= 90) idx = 2
    else idx = 3
    buckets[idx].amount += order.debtSum
    buckets[idx].orderCount += 1
  }
  return buckets
}

export function buildProfitStats(items: SaleOrderItemResponse[]): ProfitStats {
  let totalRevenue = 0
  let totalCost = 0
  for (const item of items) {
    totalRevenue += item.priceSelling * item.count
    totalCost += item.priceCost * item.count
  }
  const totalProfit = totalRevenue - totalCost
  return {
    totalRevenue,
    totalCost,
    totalProfit,
    marginPercent: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  }
}

export function buildWindowStats(items: SaleOrderItemResponse[], orders: SaleOrderResponse[]): WindowStats {
  const windowItems = items.filter((item) => calcWindowAreaM2(item.width, item.height) != null)
  const totalAreaM2 = windowItems.reduce((sum, item) => {
    const area = calcWindowAreaM2(item.width, item.height)!
    return sum + area * item.count
  }, 0)
  const windowItemCount = windowItems.reduce((sum, item) => sum + item.count, 0)
  const orderIds = new Set(windowItems.map((item) => item.saleOrderId))
  return {
    windowItemCount,
    windowOrderCount: orderIds.size,
    totalAreaM2,
    avgAreaM2: windowItemCount > 0 ? totalAreaM2 / windowItemCount : 0,
  }
}

export function buildClientSegment(
  orders: SaleOrderResponse[],
  totalDebt: number,
  daysSinceActivity: number,
): ClientSegment {
  const totalSales = orders.reduce((sum, order) => sum + order.totalSum, 0)
  if (daysSinceActivity >= 90 && orders.length > 0) return 'DORMANT'
  if (totalDebt > 0 && daysSinceActivity >= 45) return 'RISKY'
  if (totalSales >= 50_000_000 || orders.length >= 20) return 'VIP'
  return 'REGULAR'
}

export function buildSellerStats(orders: SaleOrderResponse[]): SellerStatRow[] {
  const map = new Map<number, SellerStatRow>()
  for (const order of orders) {
    if (!order.userId) continue
    const existing = map.get(order.userId) ?? {
      userId: order.userId,
      userName: order.userFullName || `#${order.userId}`,
      orderCount: 0,
      totalAmount: 0,
    }
    existing.orderCount += 1
    existing.totalAmount += order.totalSum
    map.set(order.userId, existing)
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount)
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

export function buildActRows(orders: SaleOrderResponse[], payments: PaymentResponse[]): ActRow[] {
  const rows: ActRow[] = []

  for (const order of orders) {
    rows.push({
      id: `order-${order.id}`,
      type: 'order',
      date: order.orderDate,
      orderId: order.id,
      description: `Buyurtma #${order.id}`,
      debit: order.totalSum,
      credit: 0,
      orderStatus: order.orderStatus,
      warehouseName: order.warehouseName,
    })
  }

  for (const payment of payments) {
    rows.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      date: payment.paymentDate,
      paymentId: payment.id,
      orderId: payment.saleOrderId ?? undefined,
      description: payment.saleOrderId
        ? `To‘lov #${payment.id} · Buyurtma #${payment.saleOrderId}`
        : `To‘lov #${payment.id}`,
      debit: 0,
      credit: payment.paymentAmount,
    })
  }

  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let running = 0
  return rows.map((row) => {
    running += row.credit - row.debit
    return { ...row, balance: running }
  })
}

export function buildActivityTimeline(
  orders: SaleOrderResponse[],
  payments: PaymentResponse[],
  smsHistory: DebtNotificationHistoryResponse[],
  auditLogs: AuditLog[],
  clientName: string,
): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  for (const order of orders) {
    entries.push({
      id: `tl-order-${order.id}`,
      type: 'order',
      at: order.orderDate,
      title: `Buyurtma #${order.id}`,
      description: `${order.totalSum.toLocaleString('uz-UZ')} so‘m · ${order.orderStatus}`,
      link: `/sale-orders/${order.id}/items`,
    })
  }

  for (const payment of payments) {
    entries.push({
      id: `tl-payment-${payment.id}`,
      type: 'payment',
      at: payment.paymentDate,
      title: `To‘lov #${payment.id}`,
      description: `${payment.paymentAmount.toLocaleString('uz-UZ')} so‘m${payment.saleOrderId ? ` · #${payment.saleOrderId}` : ''}`,
      link: payment.saleOrderId ? `/sale-orders/${payment.saleOrderId}/items` : undefined,
    })
  }

  for (const sms of smsHistory) {
    entries.push({
      id: `tl-sms-${sms.id}`,
      type: 'sms',
      at: sms.sentAt || sms.createdAt || new Date().toISOString(),
      title: 'Qarz SMS',
      description: sms.message || sms.phone || '—',
    })
  }

  const nameLower = clientName.toLowerCase()
  for (const log of auditLogs) {
    const matchesClient =
      log.description?.toLowerCase().includes(nameLower) ||
      log.description?.includes(String(orders[0]?.clientId ?? ''))
    if (!matchesClient) continue
    entries.push({
      id: `tl-audit-${log.id}`,
      type: 'audit',
      at: log.createdAt,
      title: `${log.action} · ${log.entity}`,
      description: log.description || '—',
    })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 100)
}

export function summarizeFinance(orders: SaleOrderResponse[], payments: PaymentResponse[]) {
  const totalSales = orders.reduce((sum, order) => sum + order.totalSum, 0)
  const totalPaidOrders = orders.reduce((sum, order) => sum + order.paidSum, 0)
  const totalDebtOrders = orders.reduce((sum, order) => sum + order.debtSum, 0)
  const totalPayments = payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
  return {
    totalSales,
    totalPaidOrders,
    totalDebtOrders,
    totalPayments,
    clientDebt: Math.max(0, totalSales - totalPayments),
  }
}
