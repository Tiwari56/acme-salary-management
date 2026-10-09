import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Employee, Meta, Page } from '../../api/types'
import { renderWithProviders } from '../../test/render'
import { EmployeesPage } from './EmployeesPage'

const meta: Meta = {
  countries: [{ code: 'IN', name: 'India', currency: 'INR' }],
  departments: { Engineering: ['Software Engineer'] },
  employment_types: ['full_time', 'part_time', 'contractor'],
  rates_as_of: '2026-01-01',
}

const priya: Employee = {
  id: 1,
  employee_code: 'EMP000001',
  first_name: 'Priya',
  last_name: 'Sharma',
  full_name: 'Priya Sharma',
  email: 'priya@acme.example',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country: 'IN',
  currency: 'INR',
  employment_type: 'full_time',
  hire_date: '2022-04-01',
  salary: 2_400_000,
  salary_usd: 28_800,
  created_at: '',
  updated_at: '',
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

describe('EmployeesPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn((url: string) => {
      if (url.startsWith('/api/meta')) return Promise.resolve(json(meta))
      if (url.startsWith('/api/employees')) {
        const q = new URL(url, 'http://x').searchParams.get('q')
        const items = q && !'priya sharma'.includes(q.toLowerCase()) ? [] : [priya]
        const page: Page<Employee> = { items, total: items.length, page: 1, page_size: 25 }
        return Promise.resolve(json(page))
      }
      return Promise.reject(new Error(`unexpected ${url}`))
    })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('renders employees with local and USD salary', async () => {
    renderWithProviders(<EmployeesPage />)
    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('₹24,00,000')).toBeInTheDocument()
    expect(screen.getByText('≈ $28,800')).toBeInTheDocument()
    expect(screen.getByText('1 total')).toBeInTheDocument()
  })

  it('sends the search term to the API and shows the empty state', async () => {
    renderWithProviders(<EmployeesPage />)
    await screen.findByText('Priya Sharma')
    await userEvent.type(screen.getByLabelText('Search employees'), 'zzz')
    expect(await screen.findByText('No employees match these filters.')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('q=zzz'))).toBe(true),
    )
  })

  it('requests USD sort when the salary header is clicked', async () => {
    renderWithProviders(<EmployeesPage />)
    await screen.findByText('Priya Sharma')
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Salary' }))
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => /sort=salary_usd&order=desc/.test(String(url))),
      ).toBe(true),
    )
  })
})
