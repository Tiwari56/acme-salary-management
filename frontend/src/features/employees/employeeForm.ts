import type { Employee, EmployeeUpdate, EmploymentType } from '../../api/types'

/** Form state: salary is '' while empty so the input can be cleared. */
export interface EmployeeFormValues {
  first_name: string
  last_name: string
  email: string
  department: string
  job_title: string
  country: string
  employment_type: EmploymentType
  hire_date: string
  salary: number | ''
  salary_change_reason: string
  salary_effective_date: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side validation mirrors the API's rules for fast feedback; the API stays the authority. */
export function validateEmployee(
  values: EmployeeFormValues,
  original?: Employee,
): Partial<Record<keyof EmployeeFormValues, string>> {
  const errors: Partial<Record<keyof EmployeeFormValues, string>> = {}
  const required: (keyof EmployeeFormValues)[] = [
    'first_name',
    'last_name',
    'email',
    'department',
    'job_title',
    'country',
    'hire_date',
  ]
  for (const field of required) {
    if (!String(values[field]).trim()) errors[field] = 'Required'
  }
  if (values.email && !EMAIL_RE.test(values.email)) errors.email = 'Enter a valid email'
  if (values.salary === '' || values.salary <= 0) errors.salary = 'Salary must be greater than 0'
  else if (!Number.isInteger(values.salary)) errors.salary = 'Use whole currency units'

  if (original && values.salary !== '' && values.salary !== original.salary) {
    if (!values.salary_change_reason.trim()) errors.salary_change_reason = 'Required for audit trail'
    if (!values.salary_effective_date) errors.salary_effective_date = 'Required'
  }
  return errors
}

const EDITABLE: (keyof EmployeeFormValues & keyof Employee)[] = [
  'first_name',
  'last_name',
  'email',
  'department',
  'job_title',
  'country',
  'employment_type',
  'hire_date',
  'salary',
]

/** Build a minimal PATCH body containing only fields that actually changed. */
export function buildUpdate(values: EmployeeFormValues, original: Employee): EmployeeUpdate {
  const patch: Record<string, unknown> = {}
  for (const field of EDITABLE) {
    const value = typeof values[field] === 'string' ? (values[field] as string).trim() : values[field]
    if (value !== original[field]) patch[field] = value
  }
  if ('salary' in patch) {
    patch.salary_change_reason = values.salary_change_reason.trim()
    patch.salary_effective_date = values.salary_effective_date
  }
  return patch as EmployeeUpdate
}
