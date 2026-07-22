export interface SaleOrderAttachment {
  fileName: string
  originalName: string
  uploadedAt: string
}

export type SaleOrderActivityType =
  | 'created'
  | 'status'
  | 'payment'
  | 'file'
  | 'message'
  | 'updated'
  | 'cancelled'

export interface SaleOrderActivityEntry {
  id: string
  type: SaleOrderActivityType
  message: string
  at: string
  by?: string | null
}

export interface SaleOrderMeta {
  deliveryDate?: string | null
  attachments?: SaleOrderAttachment[]
  cancelReason?: string | null
  activity?: SaleOrderActivityEntry[]
}

const META_DELIMITER = '\n\n---SALE_ORDER_META---\n'

export function parseSaleOrderComment(raw: string | null | undefined): {
  comment: string | null
  meta: SaleOrderMeta
} {
  if (!raw?.trim()) return { comment: null, meta: {} }
  const index = raw.indexOf(META_DELIMITER)
  if (index === -1) return { comment: raw.trim() || null, meta: {} }

  const commentPart = raw.slice(0, index).trim()
  const metaPart = raw.slice(index + META_DELIMITER.length).trim()
  try {
    const parsed = JSON.parse(metaPart) as SaleOrderMeta
    return {
      comment: commentPart || null,
      meta: {
        deliveryDate: parsed.deliveryDate ?? null,
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        cancelReason: parsed.cancelReason ?? null,
        activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      },
    }
  } catch {
    return { comment: raw.trim() || null, meta: {} }
  }
}

export function buildSaleOrderComment(comment: string | null | undefined, meta: SaleOrderMeta): string | undefined {
  const text = comment?.trim() ?? ''
  const hasMeta =
    !!meta.deliveryDate ||
    !!meta.cancelReason ||
    (meta.attachments?.length ?? 0) > 0 ||
    (meta.activity?.length ?? 0) > 0

  if (!text && !hasMeta) return undefined
  if (!hasMeta) return text || undefined

  const payload: SaleOrderMeta = {
    deliveryDate: meta.deliveryDate ?? null,
    cancelReason: meta.cancelReason ?? null,
    attachments: meta.attachments ?? [],
    activity: meta.activity ?? [],
  }
  return `${text}${META_DELIMITER}${JSON.stringify(payload)}`
}

export function appendSaleOrderActivity(
  meta: SaleOrderMeta,
  entry: Omit<SaleOrderActivityEntry, 'id'>,
): SaleOrderMeta {
  const activity = [...(meta.activity ?? [])]
  activity.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })
  return { ...meta, activity: activity.slice(0, 100) }
}

export function calcWindowAreaM2(width: number | null | undefined, height: number | null | undefined): number | null {
  if (width == null || height == null || width <= 0 || height <= 0) return null
  // En/bo'y odatda mm; maydon m²
  return (width * height) / 1_000_000
}

export function formatAreaM2(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—'
  return `${value.toFixed(2)} m²`
}
