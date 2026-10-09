import {
  ActionIcon,
  Button,
  Group,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSelector,
  IconTrash,
} from '@tabler/icons-react'
import { useState } from 'react'

import { useDeleteEmployee, useEmployees, useMeta } from '../../api/hooks'
import type { Employee, SortKey } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { formatDate, formatMoney, formatNumber } from '../../lib/format'
import { EmployeeDrawer } from './EmployeeDrawer'
import { countryOptions } from '../../lib/options'
import { EmployeeFormModal } from './EmployeeFormModal'

const PAGE_SIZE = 25

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  sort: SortKey
  order: 'asc' | 'desc'
  onSort: (key: SortKey) => void
}

function SortHeader({ label, sortKey, sort, order, onSort }: SortHeaderProps) {
  const Icon = sort !== sortKey ? IconSelector : order === 'asc' ? IconChevronUp : IconChevronDown
  return (
    <Table.Th aria-sort={sort === sortKey ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <UnstyledButton
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
      >
        {label}
        <Icon size={14} />
      </UnstyledButton>
    </Table.Th>
  )
}

export function EmployeesPage() {
  const { data: meta } = useMeta()
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 250)
  const [country, setCountry] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [editing, setEditing] = useState<Employee | undefined>()
  const [formOpen, setFormOpen] = useState(false)

  const query = {
    q: debouncedSearch.trim() || undefined,
    country: country ?? undefined,
    department: department ?? undefined,
    job_title: jobTitle ?? undefined,
    sort,
    order,
    page,
    page_size: PAGE_SIZE,
  }
  const employees = useEmployees(query)
  const remove = useDeleteEmployee()

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  const toggleSort = (key: SortKey) => {
    if (sort === key) setOrder(order === 'asc' ? 'desc' : 'asc')
    else {
      setSort(key)
      setOrder(key === 'salary_usd' || key === 'hire_date' ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (employee: Employee) => {
    setSelected(null)
    setEditing(employee)
    setFormOpen(true)
  }

  const confirmDelete = (employee: Employee) =>
    modals.openConfirmModal({
      title: `Delete ${employee.full_name}?`,
      children: (
        <Text size="sm">
          This permanently removes {employee.full_name} ({employee.employee_code}) and their salary
          history.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        remove.mutate(employee.id, {
          onSuccess: () => notifications.show({ message: `${employee.full_name} deleted` }),
          onError: (err) =>
            notifications.show({ color: 'red', title: 'Delete failed', message: err.message }),
        }),
    })

  const departmentTitles = department
    ? (meta?.departments[department] ?? [])
    : Object.values(meta?.departments ?? {}).flat()
  const total = employees.data?.total ?? 0
  const filtersActive = Boolean(search || country || department || jobTitle)
  const sortProps = { sort, order, onSort: toggleSort }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">
            {employees.data ? `${formatNumber(total)} ${filtersActive ? 'matching' : 'total'}` : ' '}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Add employee
        </Button>
      </Group>

      <Group grow preventGrowOverflow={false} wrap="wrap" align="flex-end">
        <TextInput
          placeholder="Search name, email or employee code"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => resetPage(setSearch)(e.currentTarget.value)}
          aria-label="Search employees"
          miw={240}
        />
        <Select
          placeholder="All countries"
          aria-label="Filter by country"
          clearable
          data={countryOptions(meta)}
          value={country}
          onChange={resetPage(setCountry)}
          miw={180}
        />
        <Select
          placeholder="All departments"
          aria-label="Filter by department"
          clearable
          data={Object.keys(meta?.departments ?? {})}
          value={department}
          onChange={(v) => {
            resetPage(setDepartment)(v)
            setJobTitle(null)
          }}
          miw={180}
        />
        <Select
          placeholder="All job titles"
          aria-label="Filter by job title"
          clearable
          searchable
          data={departmentTitles}
          value={jobTitle}
          onChange={resetPage(setJobTitle)}
          miw={200}
        />
      </Group>

      <Paper withBorder>
        <QueryState isLoading={employees.isLoading} error={employees.error}>
          <ScrollArea>
            <Table highlightOnHover verticalSpacing="sm" miw={860} style={{ opacity: employees.isPlaceholderData ? 0.6 : 1 }}>
              <Table.Thead>
                <Table.Tr>
                  <SortHeader {...sortProps} label="Name" sortKey="name" />
                  <SortHeader {...sortProps} label="Code" sortKey="employee_code" />
                  <SortHeader {...sortProps} label="Job title" sortKey="job_title" />
                  <SortHeader {...sortProps} label="Country" sortKey="country" />
                  <SortHeader {...sortProps} label="Salary" sortKey="salary_usd" />
                  <SortHeader {...sortProps} label="Hired" sortKey="hire_date" />
                  <Table.Th aria-label="Actions" />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {employees.data?.items.map((e) => (
                  <Table.Tr key={e.id} className="clickable-row" onClick={() => setSelected(e)}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {e.full_name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {e.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {e.employee_code}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{e.job_title}</Text>
                      <Text size="xs" c="dimmed">
                        {e.department}
                      </Text>
                    </Table.Td>
                    <Table.Td>{e.country}</Table.Td>
                    <Table.Td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <Text size="sm">{formatMoney(e.salary, e.currency)}</Text>
                      {e.currency !== 'USD' && (
                        <Text size="xs" c="dimmed">
                          ≈ {formatMoney(e.salary_usd, 'USD')}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(e.hire_date)}</Text>
                    </Table.Td>
                    <Table.Td onClick={(ev) => ev.stopPropagation()}>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon variant="subtle" aria-label={`Edit ${e.full_name}`} onClick={() => openEdit(e)}>
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${e.full_name}`}
                          onClick={() => confirmDelete(e)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {employees.data?.items.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="lg">
                        No employees match these filters.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </QueryState>
      </Paper>

      {total > PAGE_SIZE && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {formatNumber((page - 1) * PAGE_SIZE + 1)}–
            {formatNumber(Math.min(page * PAGE_SIZE, total))} of {formatNumber(total)}
          </Text>
          <Pagination total={Math.ceil(total / PAGE_SIZE)} value={page} onChange={setPage} siblings={1} />
        </Group>
      )}

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} onEdit={openEdit} />
      <EmployeeFormModal opened={formOpen} onClose={() => setFormOpen(false)} employee={editing} />
    </Stack>
  )
}
