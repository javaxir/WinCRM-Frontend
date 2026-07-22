export function calcMarkupPercent(priceCost: number, priceSelling: number): number | null {
  if (!priceCost || priceCost <= 0) return null
  return ((priceSelling - priceCost) / priceCost) * 100
}

export function calcSellingPriceFromMarkup(priceCost: number, markupPercent: number): number {
  if (!priceCost || priceCost <= 0) return 0
  return Math.round(priceCost * (1 + markupPercent / 100))
}

export function formatMarkupPercent(priceCost: number, priceSelling: number): string {
  const value = calcMarkupPercent(priceCost, priceSelling)
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}
