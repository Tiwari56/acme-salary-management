import { describe, expect, it } from 'vitest'

import type { Employee } from '../../api/types'
import { buildUpdate, validateEmployee, type EmployeeFormValues } from './employeeForm'

const employee: Employee = {
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

const values = (overrides: Partial<EmployeeFormValues> = {}): EmployeeFormValues => ({
  first_name: employee.first_name,
  last_name: employee.last_name,
  email: employee.email,
  department: employee.department,
  job_title: employee.job_title,
  country: employee.country,
  employment_type: employee.employment_type,
  hire_date: employee.hire_date,
  salary: employee.salary,
  salary_change_reason: '',
  salary_effective_date: '2026-03-01',
  ...overrides,
})

describe('validateEmployee', () => {
  it('accepts a valid employee', () => {
    expect(validateEmployee(values())).toEqual({})
  })

  it('flags required fields, bad email and non-positive salary', () => {
    const errors = validateEmployee(values({ first_name: ' ', email: 'nope', salary: 0 }))
    expect(errors.first_name).toBe('Required')
    expect(errors.email).toMatch(/valid email/)
    expect(errors.salary).toMatch(/greater than 0/)
  })

  it('rejects fractional salary', () => {
    expect(validateEmployee(values({ salary: 100.5 })).salary).toMatch(/whole/)
  })

  it('requires a reason only when editing changes the salary', () => {
    expect(validateEmployee(values({ salary: 2_600_000 }), employee).salary_change_reason).toBeDefined()
    expect(validateEmployee(values({ salary: 2_600_000 })).salary_change_reason).toBeUndefined()
    expect(validateEmployee(values(), employee)).toEqual({})
  })
})

describe('buildUpdate', () => {
  it('is empty when nothing changed', () => {
    expect(buildUpdate(values(), employee)).toEqual({})
  })

  it('includes only changed fields, trimmed', () => {
    expect(buildUpdate(values({ last_name: ' Iyer ' }), employee)).toEqual({ last_name: 'Iyer' })
  })

  it('attaches audit fields to a salary change', () => {
    const patch = buildUpdate(
      values({ salary: 2_600_000, salary_change_reason: ' Promotion ' }),
      employee,
    )
    expect(patch).toEqual({
      salary: 2_600_000,
      salary_change_reason: 'Promotion',
      salary_effective_date: '2026-03-01',
    })
  })
})
