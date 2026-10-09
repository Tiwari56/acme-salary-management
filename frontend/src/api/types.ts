export type EmploymentType = 'full_time' | 'part_time' | 'contractor'

export interface Employee {
  id: number
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  job_title: string
  department: string
  country: string
  currency: string
  employment_type: EmploymentType
  hire_date: string
  salary: number
  salary_usd: number
  created_at: string
  updated_at: string
}

export interface EmployeeInput {
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  country: string
  employment_type: EmploymentType
  hire_date: string
  salary: number
}

export interface EmployeeUpdate extends Partial<EmployeeInput> {
  salary_change_reason?: string
  salary_effective_date?: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export type SortKey =
  | 'name'
  | 'employee_code'
  | 'hire_date'
  | 'salary'
  | 'salary_usd'
  | 'country'
  | 'department'
  | 'job_title'

export interface EmployeeQuery {
  q?: string
  country?: string
  department?: string
  job_title?: string
  sort?: SortKey
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface SalaryChange {
  id: number
  previous_salary: number | null
  new_salary: number
  effective_date: string
  reason: string
  created_at: string
}

export interface Stats {
  count: number
  total: number
  min: number
  max: number
  mean: number
  median: number
}

export interface Summary {
  headcount: number
  payroll_usd: number
  median_usd: number
  mean_usd: number
  countries: number
  rates_as_of: string
}

export interface CountryInsight {
  country: string
  country_name: string
  currency: string
  local: Stats
  usd: Stats
}

export interface DepartmentInsight {
  department: string
  usd: Stats
}

export interface JobTitleInsights {
  country: string
  currency: string
  items: { job_title: string; department: string; local: Stats }[]
}

export interface Distribution {
  currency: 'USD'
  bucket_size: number
  buckets: { lower: number; upper: number; count: number }[]
}

export interface Meta {
  countries: { code: string; name: string; currency: string }[]
  departments: Record<string, string[]>
  employment_types: EmploymentType[]
  rates_as_of: string
}
