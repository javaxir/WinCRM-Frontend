import type { SupplierActRow } from '@/utils/supplierDetailAnalytics'

export function buildSupplierActCsv(
  supplierName: string,
  periodStart: string,
  periodEnd: string,
  rows: SupplierActRow[],
  totals: { totalPurchases: number; totalPaid: number; balance: number },
) {
  const lines = [
    'Akt svodka',
    `Yetkazib beruvchi,${escapeCsv(supplierName)}`,
    `Davr,${periodStart || '—'} — ${periodEnd || '—'}`,
    `Jami kirim,${totals.totalPurchases}`,
    `Jami to'langan,${totals.totalPaid}`,
    `Balans,${totals.balance}`,
    '',
    'Turi,Sana,Tavsif,Debit,Kredit,Balans,Yaratgan',
  ]

  for (const row of rows) {
    lines.push(
      [
        row.type === 'order' ? 'Kirim' : "To'lov",
        row.date,
        escapeCsv(row.description),
        row.debit,
        row.credit,
        row.balance ?? '',
        escapeCsv(row.createdUsername || ''),
      ].join(','),
    )
  }
  return lines.join('\n')
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
