import type { EmploymentType } from '../api/types'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

/** Whole-unit money in the given ISO currency, e.g. formatMoney(2400000, 'INR') -> "₹24,00,000". */
export function formatMoney(amount: number, currency: string, locale = 'en-US'): string {
  const key = `${locale}:${currency}`
  let fmt = moneyFormatters.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })
    moneyFormatters.set(key, fmt)
  }
  return fmt.format(amount)
}

/** Compact USD for tiles/axes: 803742569 -> "$803.7M". */
export function formatCompactUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    // Explicit minimum: older ICU versions (e.g. Node 22) otherwise render "$10.0K".
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
}

export const employmentTypeLabel = (t: EmploymentType) => EMPLOYMENT_LABELS[t] ?? t

/** Signed percentage change between two salaries, e.g. "+10.0%". Null for the initial record. */
export function percentChange(previous: number | null, next: number): string | null {
  if (previous === null || previous === 0) return null
  const pct = ((next - previous) / previous) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
