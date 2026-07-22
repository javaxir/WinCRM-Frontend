import type { GoodsType, GoodsResponse } from '@/services/goods'

const SERVICE_TYPE_LABELS = new Set(['xizmat', 'услуга', 'service'])

export function normalizeGoodsType(value?: string | null): GoodsType | null {
  if (!value) return null
  const upper = value.trim().toUpperCase()
  if (upper === 'PRODUCT' || upper === 'SERVICE' || upper === 'WINDOW') {
    return upper
  }
  return null
}

export function isServiceGoodsType(goods?: Pick<GoodsResponse, 'type' | 'typeLabel'> | null): boolean {
  if (!goods) return false
  if (goods.type === 'SERVICE') return true
  const fromType = normalizeGoodsType(goods.type)
  if (fromType === 'SERVICE') return true
  const label = goods.typeLabel?.trim().toLowerCase()
  return !!label && SERVICE_TYPE_LABELS.has(label)
}

export function requiresStockValidation(goods?: Pick<GoodsResponse, 'type' | 'typeLabel'> | null): boolean {
  return !!goods && !isServiceGoodsType(goods)
}
