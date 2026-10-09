import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { request, toQueryString } from './client'
import type {
  CountryInsight,
  DepartmentInsight,
  Distribution,
  Employee,
  EmployeeInput,
  EmployeeQuery,
  EmployeeUpdate,
  JobTitleInsights,
  Meta,
  Page,
  SalaryChange,
  Summary,
} from './types'

const keys = {
  meta: ['meta'] as const,
  employees: ['employees'] as const,
  employeeList: (q: EmployeeQuery) => ['employees', 'list', q] as const,
  employee: (id: number) => ['employees', 'detail', id] as const,
  history: (id: number) => ['employees', 'history', id] as const,
  insights: ['insights'] as const,
}

export function useMeta() {
  return useQuery({
    queryKey: keys.meta,
    queryFn: () => request<Meta>('/api/meta'),
    staleTime: Infinity,
  })
}

export function useEmployees(query: EmployeeQuery) {
  return useQuery({
    queryKey: keys.employeeList(query),
    queryFn: () => request<Page<Employee>>(`/api/employees${toQueryString(query)}`),
    placeholderData: keepPreviousData, // keep the table populated while the next page loads
  })
}

export function useSalaryHistory(id: number | null) {
  return useQuery({
    queryKey: keys.history(id ?? 0),
    queryFn: () => request<SalaryChange[]>(`/api/employees/${id}/salary-history`),
    enabled: id !== null,
  })
}

/** Any write invalidates employee lists/details and every insight, since pay stats change. */
function useInvalidateAfterWrite() {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.employees }),
      client.invalidateQueries({ queryKey: keys.insights }),
    ])
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAfterWrite()
  return useMutation({
    mutationFn: (input: EmployeeInput) =>
      request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: invalidate,
  })
}

export function useUpdateEmployee() {
  const invalidate = useInvalidateAfterWrite()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmployeeUpdate }) =>
      request<Employee>(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  })
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateAfterWrite()
  return useMutation({
    mutationFn: (id: number) => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

const insight = <T,>(path: string, params: object = {}, enabled = true) => ({
  queryKey: [...keys.insights, path, params],
  queryFn: () => request<T>(`/api/insights/${path}${toQueryString(params)}`),
  enabled,
})

export const useSummary = (country?: string) =>
  useQuery(insight<Summary>('summary', { country }))
export const useByCountry = () => useQuery(insight<CountryInsight[]>('by-country'))
export const useByDepartment = (country?: string) =>
  useQuery(insight<DepartmentInsight[]>('by-department', { country }))
export const useByJobTitle = (country?: string) =>
  useQuery(insight<JobTitleInsights>('by-job-title', { country }, Boolean(country)))
export const useDistribution = (country?: string, department?: string) =>
  useQuery(insight<Distribution>('distribution', { country, department }))
