import { describe, expect, it } from 'vitest'

import { employmentTypeLabel, formatCompactUsd, formatDate, formatMoney, percentChange } from './format'

describe('formatMoney', () => {
  it('formats whole units without decimals', () => {
    expect(formatMoney(120000, 'USD')).toBe('$120,000')
  })
  it('uses Indian digit grouping for INR', () => {
    expect(formatMoney(2400000, 'INR')).toBe('₹24,00,000')
  })
  it('formats euros', () => {
    expect(formatMoney(85000, 'EUR')).toBe('€85,000')
  })
})

describe('formatCompactUsd', () => {
  it('abbreviates large values', () => {
    expect(formatCompactUsd(803_742_569)).toBe('$803.7M')
    expect(formatCompactUsd(10_000)).toBe('$10K')
  })
})

describe('percentChange', () => {
  it('returns signed percentage', () => {
    expect(percentChange(100, 110)).toBe('+10.0%')
    expect(percentChange(200, 150)).toBe('-25.0%')
  })
  it('is null for the initial salary record', () => {
    expect(percentChange(null, 100)).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats ISO dates without timezone drift', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024')
  })
})

it('labels employment types', () => {
  expect(employmentTypeLabel('full_time')).toBe('Full-time')
  expect(employmentTypeLabel('contractor')).toBe('Contractor')
})
