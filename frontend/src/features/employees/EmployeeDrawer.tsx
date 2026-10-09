import { Badge, Button, Divider, Drawer, Group, Stack, Text, Timeline, Title } from '@mantine/core'
import { IconEdit } from '@tabler/icons-react'

import { useSalaryHistory } from '../../api/hooks'
import type { Employee } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { employmentTypeLabel, formatDate, formatMoney, percentChange } from '../../lib/format'

interface Props {
  employee: Employee | null
  onClose: () => void
  onEdit: (employee: Employee) => void
}

export function EmployeeDrawer({ employee, onClose, onEdit }: Props) {
  return (
    <Drawer
      opened={employee !== null}
      onClose={onClose}
      position="right"
      size="md"
      title={employee && <Title order={4}>{employee.full_name}</Title>}
    >
      {employee && <EmployeeDetail employee={employee} onEdit={onEdit} />}
    </Drawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" ta="right">
        {children}
      </Text>
    </Group>
  )
}

function EmployeeDetail({ employee, onEdit }: { employee: Employee; onEdit: (e: Employee) => void }) {
  const history = useSalaryHistory(employee.id)

  return (
    <Stack>
      <Group gap="xs">
        <Badge variant="light">{employee.employee_code}</Badge>
        <Badge variant="outline" color="gray">
          {employmentTypeLabel(employee.employment_type)}
        </Badge>
      </Group>
      <Stack gap={6}>
        <Field label="Email">{employee.email}</Field>
        <Field label="Job title">{employee.job_title}</Field>
        <Field label="Department">{employee.department}</Field>
        <Field label="Country">{employee.country}</Field>
        <Field label="Hire date">{formatDate(employee.hire_date)}</Field>
        <Field label="Annual salary">
          <b>{formatMoney(employee.salary, employee.currency)}</b>
          {employee.currency !== 'USD' && (
            <Text span size="xs" c="dimmed">
              {' '}
              ≈ {formatMoney(employee.salary_usd, 'USD')}
            </Text>
          )}
        </Field>
      </Stack>
      <Button leftSection={<IconEdit size={16} />} variant="light" onClick={() => onEdit(employee)}>
        Edit employee
      </Button>
      <Divider label="Salary history" labelPosition="left" />
      <QueryState isLoading={history.isLoading} error={history.error}>
        <Timeline active={0} bulletSize={14} lineWidth={2}>
          {history.data?.map((change) => {
            const pct = percentChange(change.previous_salary, change.new_salary)
            return (
              <Timeline.Item
                key={change.id}
                title={
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      {formatMoney(change.new_salary, employee.currency)}
                    </Text>
                    {pct && (
                      <Badge size="xs" variant="light" color={pct.startsWith('-') ? 'red' : 'teal'}>
                        {pct}
                      </Badge>
                    )}
                  </Group>
                }
              >
                <Text size="xs" c="dimmed">
                  {change.reason} · effective {formatDate(change.effective_date)}
                </Text>
              </Timeline.Item>
            )
          })}
        </Timeline>
      </QueryState>
    </Stack>
  )
}
