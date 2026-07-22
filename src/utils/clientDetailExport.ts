import type { ActRow } from '@/utils/clientDetailAnalytics'

export function buildClientActCsv(
  clientName: string,
  periodStart: string,
  periodEnd: string,
  rows: ActRow[],
  totals: { totalSales: number; totalPaid: number; balance: number },
) {
  const lines = [
    'Akt svodka',
    `Mijoz,${escapeCsv(clientName)}`,
    `Davr,${periodStart || '—'} — ${periodEnd || '—'}`,
    `Jami sotuv,${totals.totalSales}`,
    `Jami to'langan,${totals.totalPaid}`,
    `Balans,${totals.balance}`,
    '',
    'Turi,Sana,Tavsif,Debit,Kredit,Balans',
  ]

  for (const row of rows) {
    lines.push(
      [
        row.type === 'order' ? 'Buyurtma' : 'To\'lov',
        row.date,
        escapeCsv(row.description),
        row.debit,
        row.credit,
        row.balance ?? '',
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
