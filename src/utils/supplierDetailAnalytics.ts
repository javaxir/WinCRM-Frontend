import type { AuditLog } from '@/services/audit'
import type { SupplierPaymentResponse } from '@/services/supplierPayments'
import type { WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'
import type { WarehouseOrderResponse } from '@/services/warehouseOrders'

export type SupplierActRowType = 'order' | 'payment'

export interface SupplierActRow {
  id: string
  type: SupplierActRowType
  date: string
  orderId?: number
  paymentId?: number
  description: string
  debit: number
  credit: number
  balance?: number
  status?: string
  warehouseName?: string
  createdUsername?: string | null
}

export type SupplierTimelineEntryType = 'order' | 'payment' | 'audit'

export interface SupplierTimelineEntry {
  id: string
  type: SupplierTimelineEntryType
  at: string
  title: string
  description: string
  link?: string
  createdUsername?: string | null
}

export interface SupplierWarehouseStatRow {
  warehouseName: string
  orderCount: number
  totalAmount: number
}

export interface SupplierFinanceSummary {
  totalPurchases: number
  totalPaid: number
  totalDebt: number
  ordersCount: number
}

export function summarizeSupplierFinance(
  orders: WarehouseOrderResponse[],
  payments: SupplierPaymentResponse[],
): SupplierFinanceSummary {
  const totalPurchases = orders.reduce((sum, order) => sum + order.totalSum, 0)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.paymentAmount, 0)
  return {
    totalPurchases,
    totalPaid,
    totalDebt: Math.max(0, totalPurchases - totalPaid),
    ordersCount: orders.length,
  }
}

export function buildWarehouseStatsFromOrders(orders: WarehouseOrderResponse[]): SupplierWarehouseStatRow[] {
  const map = new Map<string, SupplierWarehouseStatRow>()
  for (const order of orders) {
    const name = order.warehouseName || '—'
    const existing = map.get(name) ?? { warehouseName: name, orderCount: 0, totalAmount: 0 }
    existing.orderCount += 1
    existing.totalAmount += order.totalSum
    map.set(name, existing)
  }
  return [...map.values()].sort((a, b) => b.totalAmount - a.totalAmount)
}

export function buildSupplierActRows(
  orders: WarehouseOrderResponse[],
  payments: SupplierPaymentResponse[],
): SupplierActRow[] {
  const rows: SupplierActRow[] = []

  for (const order of orders) {
    rows.push({
      id: `order-${order.id}`,
      type: 'order',
      date: order.arrivalDate,
      orderId: order.id,
      description: `Kirim buyurtmasi #${order.id}`,
      debit: order.totalSum,
      credit: 0,
      status: order.status,
      warehouseName: order.warehouseName,
      createdUsername: order.createdUsername,
    })
  }

  for (const payment of payments) {
    rows.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      date: payment.paymentDate,
      paymentId: payment.id,
      orderId: payment.warehouseOrderId ?? undefined,
      description: payment.warehouseOrderId
        ? `To‘lov #${payment.id} · Buyurtma #${payment.warehouseOrderId}`
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

export function buildSupplierTimeline(
  orders: WarehouseOrderResponse[],
  payments: SupplierPaymentResponse[],
  auditLogs: AuditLog[],
  supplierId: number,
  supplierName: string,
): SupplierTimelineEntry[] {
  const entries: SupplierTimelineEntry[] = []

  for (const order of orders) {
    entries.push({
      id: `tl-order-${order.id}`,
      type: 'order',
      at: order.arrivalDate,
      title: `Kirim buyurtmasi #${order.id}`,
      description: `${order.totalSum.toLocaleString('uz-UZ')} so‘m · ${order.warehouseName || '—'}`,
      link: `/warehouse-orders/${order.id}/items`,
      createdUsername: order.createdUsername,
    })
  }

  for (const payment of payments) {
    entries.push({
      id: `tl-payment-${payment.id}`,
      type: 'payment',
      at: payment.paymentDate,
      title: `To‘lov #${payment.id}`,
      description: `${payment.paymentAmount.toLocaleString('uz-UZ')} so‘m${payment.warehouseOrderId ? ` · #${payment.warehouseOrderId}` : ''}`,
      link: payment.warehouseOrderId ? `/warehouse-orders/${payment.warehouseOrderId}/items` : undefined,
    })
  }

  const nameLower = supplierName.toLowerCase()
  for (const log of auditLogs) {
    const entity = log.entity?.toUpperCase() || ''
    const matchesSupplier =
      entity.includes('SUPPLIER') &&
      (log.description?.includes(String(supplierId)) ||
        log.description?.toLowerCase().includes(nameLower))
    if (!matchesSupplier) continue
    entries.push({
      id: `tl-audit-${log.id}`,
      type: 'audit',
      at: log.createdAt,
      title: `${log.action} · ${log.entity}`,
      description: log.description || '—',
      createdUsername: log.username,
    })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 100)
}

export function filterSupplierAuditLogs(
  logs: AuditLog[],
  supplierId: number,
  supplierName: string,
) {
  const nameLower = supplierName.toLowerCase()
  return logs.filter((log) => {
    const entity = log.entity?.toUpperCase() || ''
    if (!entity.includes('SUPPLIER')) return false
    return (
      log.description?.includes(String(supplierId)) ||
      log.description?.toLowerCase().includes(nameLower) ||
      log.description?.includes(supplierName)
    )
  })
}

export function buildPopularProducts(items: WarehouseOrderItemResponse[]) {
  const map = new Map<string, { name: string; amount: number; quantity: number; goodsId: number }>()
  for (const item of items) {
    const existing = map.get(item.goodsName) || {
      name: item.goodsName,
      amount: 0,
      quantity: 0,
      goodsId: item.goodsId,
    }
    existing.amount += item.priceCost * item.count
    existing.quantity += item.count
    map.set(item.goodsName, existing)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}
