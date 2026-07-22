export function formatIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export interface DateRange {
  startDate: string
  endDate: string
}

export function getYesterdayRange(): DateRange {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const date = formatIsoDate(d)
  return { startDate: date, endDate: date }
}

export function getTodayRange(): DateRange {
  const date = formatIsoDate(new Date())
  return { startDate: date, endDate: date }
}

export function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatIsoDate(d)
}

export function addDaysFromToday(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return formatIsoDate(d)
}

export function getThisWeekRange(): DateRange {
  const now = new Date()
  const start = new Date(now)
  const day = now.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  start.setDate(now.getDate() - daysFromMonday)
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(now) }
}

export function getThisMonthRange(): DateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(now) }
}

export function getThisYearRange(): DateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(now) }
}

export interface DateParts {
  day: string
  month: string
  year: string
}

export function parseDateParts(iso?: string): DateParts {
  if (!iso) return { day: '', month: '', year: '' }
  const [year, month, day] = iso.split('-')
  return { day: day || '', month: month || '', year: year || '' }
}

export function buildDateFromParts(day: string, month: string, year: string): string | null {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  if (!d || !m || !y || y < 1000) return null
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return formatIsoDate(date)
}

export function formatDisplayRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return ''
  if (!startDate || !endDate || startDate === endDate) return startDate || endDate || ''
  return `${startDate} — ${endDate}`
}

export function toStartDateTime(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toISOString()
}

export function toEndDateTime(isoDate: string): string {
  return new Date(`${isoDate}T23:59:59`).toISOString()
}
