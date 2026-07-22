import type { SaleOrderResponse } from '@/services/saleOrders'

export interface UserReportExportMeta {
  userName: string
  periodStart: string
  periodEnd: string
  orderCount: number
  totalAmount: number
  paidAmount: number
  debtAmount: number
  completedCount: number
  avgCheck: number
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function buildUserReportCsv(meta: UserReportExportMeta, orders: SaleOrderResponse[]) {
  const lines: string[] = [
    'Foydalanuvchi hisoboti',
    `Sotuvchi,${escapeCsv(meta.userName)}`,
    `Davr,${meta.periodStart} — ${meta.periodEnd}`,
    `Buyurtmalar,${meta.orderCount}`,
    `Sotuv summasi,${meta.totalAmount}`,
    `To'langan,${meta.paidAmount}`,
    `Qarz,${meta.debtAmount}`,
    `Yakunlangan,${meta.completedCount}`,
    `O'rtacha chek,${Math.round(meta.avgCheck)}`,
    '',
    'ID,Mijoz,Sana,Holat,Jami,To\'langan,Qarz',
  ]

  for (const order of orders) {
    lines.push(
      [
        order.id,
        escapeCsv(order.clientFullName),
        order.orderDate,
        order.orderStatus,
        order.totalSum,
        order.paidSum,
        order.debtSum,
      ].join(','),
    )
  }

  return lines.join('\n')
}

export function downloadUserReportCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
