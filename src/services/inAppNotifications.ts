import { fetchDebtNotificationHistory } from '@/services/notifications'
import { fetchAllPayments } from '@/services/payments'
import { fetchSaleOrdersByDateRange, type SaleOrderResponse } from '@/services/saleOrders'
import { fetchAllStocks } from '@/services/stocks'
import { formatIsoDate } from '@/utils/dateRange'

export type InAppNotificationType =
  | 'NEW_ORDER'
  | 'NEW_PAYMENT'
  | 'LOW_STOCK'
  | 'SMS_FAILED'

export interface InAppNotification {
  id: string
  type: InAppNotificationType
  titleKey: string
  titleParams?: Record<string, string | number>
  messageKey: string
  messageParams?: Record<string, string | number>
  link: string
  at: string
}

const SNAPSHOT_KEY = 'inAppOrderSnapshot'
const READ_IDS_KEY = 'inAppNotificationReadIds'
const LOW_STOCK_THRESHOLD = 5
const LOOKBACK_DAYS = 7
const MAX_ITEMS = 30

interface OrderSnapshot {
  createdAt: string
}

function loadSnapshot(): Record<number, OrderSnapshot> {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as Record<number, OrderSnapshot>) : {}
  } catch {
    return {}
  }
}

function saveSnapshot(orders: SaleOrderResponse[]) {
  const next: Record<number, OrderSnapshot> = {}
  for (const order of orders) {
    next[order.id] = { createdAt: order.createdAt }
  }
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next))
}

export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(list)
  } catch {
    return new Set()
  }
}

export function markNotificationsRead(ids: string[]) {
  const set = getReadNotificationIds()
  ids.forEach((id) => set.add(id))
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...set].slice(-500)))
}

export function markAllNotificationsRead(ids: string[]) {
  markNotificationsRead(ids)
}

function withinLookback(iso: string) {
  const ts = new Date(iso).getTime()
  const cutoff = Date.now() - LOOKBACK_DAYS * 86_400_000
  return !Number.isNaN(ts) && ts >= cutoff
}

function getLookbackRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - LOOKBACK_DAYS)
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) }
}

function filterOrdersForUser(orders: SaleOrderResponse[], userId: number | null, isAdmin: boolean) {
  const active = orders.filter((order) => order.status === 'ACTIVE')
  if (isAdmin || !userId) return active
  return active.filter((order) => order.userId === userId)
}

function filterPaymentsForUser(
  payments: Awaited<ReturnType<typeof fetchAllPayments>>,
  username: string | null,
  isAdmin: boolean,
  orderIds: Set<number>,
) {
  const active = payments.filter((payment) => payment.status === 'ACTIVE')
  if (isAdmin) return active
  return active.filter(
    (payment) =>
      payment.createdUsername === username ||
      (payment.saleOrderId != null && orderIds.has(payment.saleOrderId)),
  )
}

export async function fetchInAppNotifications(context: {
  userId: number | null
  username: string | null
  isAdmin: boolean
}): Promise<InAppNotification[]> {
  const { startDate, endDate } = getLookbackRange()
  const previousSnapshot = loadSnapshot()

  const [ordersRaw, paymentsRaw, stocksRaw, smsRaw] = await Promise.all([
    fetchSaleOrdersByDateRange(startDate, endDate),
    fetchAllPayments(),
    fetchAllStocks(),
    fetchDebtNotificationHistory(0, 200),
  ])

  const orders = filterOrdersForUser(ordersRaw, context.userId, context.isAdmin)
  const orderIds = new Set(orders.map((order) => order.id))
  const payments = filterPaymentsForUser(paymentsRaw, context.username, context.isAdmin, orderIds)

  const clientIds = new Set(
    orders.map((order) => order.clientId).filter((id): id is number => id != null),
  )

  const items: InAppNotification[] = []

  for (const order of orders) {
    const prev = previousSnapshot[order.id]
    const isNew = !prev && withinLookback(order.createdAt)

    if (isNew) {
      items.push({
        id: `NEW_ORDER-${order.id}`,
        type: 'NEW_ORDER',
        titleKey: 'headerNotifications.newOrderTitle',
        messageKey: 'headerNotifications.newOrderMessage',
        messageParams: {
          id: order.id,
          client: order.clientFullName || '—',
          amount: order.totalSum,
        },
        link: `/sale-orders/${order.id}/items`,
        at: order.createdAt,
      })
    }
  }

  saveSnapshot(orders)

  for (const payment of payments) {
    if (!withinLookback(payment.createdAt) && !withinLookback(payment.paymentDate)) continue
    items.push({
      id: `NEW_PAYMENT-${payment.id}`,
      type: 'NEW_PAYMENT',
      titleKey: 'headerNotifications.newPaymentTitle',
      messageKey: 'headerNotifications.newPaymentMessage',
      messageParams: {
        amount: payment.paymentAmount,
        client: payment.clientFullName || '—',
        orderId: payment.saleOrderId ?? '—',
      },
      link: payment.saleOrderId ? `/sale-orders/${payment.saleOrderId}/items` : '/payments',
      at: payment.createdAt || payment.paymentDate,
    })
  }

  if (context.isAdmin) {
    const lowStocks = stocksRaw
      .filter((stock) => stock.status === 'ACTIVE' && stock.count <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.count - b.count)
      .slice(0, 8)

    for (const stock of lowStocks) {
      items.push({
        id: `LOW_STOCK-${stock.id}`,
        type: 'LOW_STOCK',
        titleKey: 'headerNotifications.lowStockTitle',
        messageKey: 'headerNotifications.lowStockMessage',
        messageParams: {
          goods: stock.goodsName,
          warehouse: stock.warehouseName,
          count: stock.count,
        },
        link: '/stocks',
        at: stock.updatedAt || stock.createdAt,
      })
    }
  }

  const smsItems = smsRaw.filter((row) => {
    if (row.success !== false) return false
    const at = row.sentAt || row.createdAt
    if (!at || !withinLookback(at)) return false
    if (context.isAdmin) return true
    return row.clientId != null && clientIds.has(row.clientId)
  })

  for (const sms of smsItems.slice(0, 10)) {
    items.push({
      id: `SMS_FAILED-${sms.id}`,
      type: 'SMS_FAILED',
      titleKey: 'headerNotifications.smsFailedTitle',
      messageKey: 'headerNotifications.smsFailedMessage',
      messageParams: {
        client: sms.clientFullName || sms.phone || '—',
        error: sms.errorMessage || sms.status || '—',
      },
      link: sms.clientId ? `/clients/${sms.clientId}` : '/sms/history',
      at: sms.sentAt || sms.createdAt || new Date().toISOString(),
    })
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, MAX_ITEMS)
}
