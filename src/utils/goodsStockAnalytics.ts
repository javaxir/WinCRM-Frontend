import type { StockHistoryResponse } from '@/services/stockHistories'
import type { SaleOrderItemResponse } from '@/services/saleOrderItems'
import type { WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'
import type { StockResponse } from '@/services/stocks'

export const LOW_STOCK_THRESHOLD = 5

export type GoodsStockRow = {
  warehouseId: number
  warehouseName: string
  received: number
  sold: number
  balance: number
  currentStock: number
  hasMismatch: boolean
  isLowStock: boolean
}

export type GoodsStockSummary = {
  received: number
  sold: number
  balance: number
  currentStock: number
}

export type SalesVelocityStats = {
  soldLast7Days: number
  soldLast30Days: number
  dailyAvg7: number
  dailyAvg30: number
  lastSaleDate: string | null
  daysUntilStockout: number | null
}

export type StockTimelineEvent = {
  id: number
  kind: 'IN' | 'OUT' | 'SALE' | 'INCOMING'
  title: string
  count: number
  balanceAfter?: number
  warehouseName: string
  at: string
  comment?: string | null
}

export function buildGoodsStockRows(
  incoming: WarehouseOrderItemResponse[],
  outgoing: SaleOrderItemResponse[],
  stocks: StockResponse[],
): GoodsStockRow[] {
  const map = new Map<number, GoodsStockRow>()

  const ensureRow = (warehouseId: number, warehouseName: string): GoodsStockRow => {
    const existing = map.get(warehouseId)
    if (existing) return existing
    const row: GoodsStockRow = {
      warehouseId,
      warehouseName,
      received: 0,
      sold: 0,
      balance: 0,
      currentStock: 0,
      hasMismatch: false,
      isLowStock: false,
    }
    map.set(warehouseId, row)
    return row
  }

  for (const item of incoming) {
    ensureRow(item.warehouseId, item.warehouseName).received += item.count
  }

  for (const item of outgoing) {
    ensureRow(item.warehouseId, item.warehouseName).sold += item.count
  }

  for (const stock of stocks) {
    ensureRow(stock.warehouseId, stock.warehouseName).currentStock = stock.count
  }

  return [...map.values()].map((row) => {
    const balance = row.received - row.sold
    const hasMismatch = balance !== row.currentStock
    const isLowStock = row.currentStock <= LOW_STOCK_THRESHOLD
    return { ...row, balance, hasMismatch, isLowStock }
  })
}

export function summarizeStockRows(rows: GoodsStockRow[]): GoodsStockSummary {
  return rows.reduce(
    (acc, row) => ({
      received: acc.received + row.received,
      sold: acc.sold + row.sold,
      balance: acc.balance + row.balance,
      currentStock: acc.currentStock + row.currentStock,
    }),
    { received: 0, sold: 0, balance: 0, currentStock: 0 },
  )
}

export function computeSalesVelocity(
  outgoing: SaleOrderItemResponse[],
  currentStock: number,
): SalesVelocityStats {
  const now = Date.now()
  const ms7 = 7 * 24 * 60 * 60 * 1000
  const ms30 = 30 * 24 * 60 * 60 * 1000

  let soldLast7Days = 0
  let soldLast30Days = 0
  let lastSaleDate: string | null = null
  let lastSaleTs = 0

  for (const item of outgoing) {
    const ts = new Date(item.arrivalDate || item.createdAt).getTime()
    if (isNaN(ts)) continue
    if (ts > lastSaleTs) {
      lastSaleTs = ts
      lastSaleDate = item.arrivalDate || item.createdAt
    }
    if (now - ts <= ms7) soldLast7Days += item.count
    if (now - ts <= ms30) soldLast30Days += item.count
  }

  const dailyAvg7 = soldLast7Days / 7
  const dailyAvg30 = soldLast30Days / 30
  const rate = dailyAvg30 > 0 ? dailyAvg30 : dailyAvg7

  return {
    soldLast7Days,
    soldLast30Days,
    dailyAvg7,
    dailyAvg30,
    lastSaleDate,
    daysUntilStockout: rate > 0 && currentStock > 0 ? Math.ceil(currentStock / rate) : null,
  }
}

export function buildStockTimeline(
  histories: StockHistoryResponse[],
  limit = 20,
): StockTimelineEvent[] {
  return [...histories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      kind: item.stockStatus,
      title: item.stockStatus === 'IN' ? 'Kirim' : 'Chiqim',
      count: item.count,
      balanceAfter: item.balanceAfter,
      warehouseName: item.warehouseName,
      at: item.createdAt,
      comment: item.comment,
    }))
}

export function filterHistoriesByWarehouse(
  histories: StockHistoryResponse[],
  warehouseId: number,
) {
  return histories.filter((item) => item.warehouseId === warehouseId)
}
