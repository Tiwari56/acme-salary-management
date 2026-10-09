import { Button, Group, Modal, NumberInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'

import { useCreateEmployee, useMeta, useUpdateEmployee } from '../../api/hooks'
import type { Employee, EmployeeInput, EmployeeUpdate, EmploymentType } from '../../api/types'
import { employmentTypeLabel } from '../../lib/format'
import { countryOptions } from '../../lib/options'
import { buildUpdate, validateEmployee, type EmployeeFormValues } from './employeeForm'

const today = () => new Date().toISOString().slice(0, 10)

function initialValues(employee?: Employee): EmployeeFormValues {
  return {
    first_name: employee?.first_name ?? '',
    last_name: employee?.last_name ?? '',
    email: employee?.email ?? '',
    department: employee?.department ?? '',
    job_title: employee?.job_title ?? '',
    country: employee?.country ?? '',
    employment_type: employee?.employment_type ?? 'full_time',
    hire_date: employee?.hire_date ?? today(),
    salary: employee?.salary ?? '',
    salary_change_reason: '',
    salary_effective_date: today(),
  }
}

interface Props {
  opened: boolean
  onClose: () => void
  /** When given, the modal edits this employee; otherwise it creates a new one. */
  employee?: Employee
}

export function EmployeeFormModal({ opened, onClose, employee }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={employee ? `Edit ${employee.full_name}` : 'Add employee'}
      size="lg"
    >
      {/* Keyed so the form resets whenever a different employee is opened. */}
      {opened && <EmployeeForm key={employee?.id ?? 'new'} employee={employee} onDone={onClose} />}
    </Modal>
  )
}

function EmployeeForm({ employee, onDone }: { employee?: Employee; onDone: () => void }) {
  const { data: meta } = useMeta()
  const create = useCreateEmployee()
  const update = useUpdateEmployee()
  const form = useForm<EmployeeFormValues>({
    initialValues: initialValues(employee),
    validate: (values) => validateEmployee(values, employee),
  })

  const salaryChanged = employee !== undefined && form.values.salary !== employee.salary
  const currency = meta?.countries.find((c) => c.code === form.values.country)?.currency
  const titles = meta?.departments[form.values.department] ?? []

  const submit = form.onSubmit(async (values) => {
    try {
      if (employee) {
        const patch: EmployeeUpdate = buildUpdate(values, employee)
        if (Object.keys(patch).length > 0) await update.mutateAsync({ id: employee.id, data: patch })
        notifications.show({ color: 'green', message: `${values.first_name} updated` })
      } else {
        const { salary_change_reason: _r, salary_effective_date: _d, ...rest } = values
        await create.mutateAsync({ ...rest, salary: Number(values.salary) } as EmployeeInput)
        notifications.show({ color: 'green', message: `${values.first_name} added` })
      }
      onDone()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Save failed', message: (err as Error).message })
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="First name" required {...form.getInputProps('first_name')} />
          <TextInput label="Last name" required {...form.getInputProps('last_name')} />
        </SimpleGrid>
        <TextInput label="Work email" type="email" required {...form.getInputProps('email')} />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Department"
            required
            searchable
            data={Object.keys(meta?.departments ?? {})}
            {...form.getInputProps('department')}
            onChange={(value) => {
              form.setFieldValue('department', value ?? '')
              form.setFieldValue('job_title', '') // titles are department-specific
            }}
          />
          <Select
            label="Job title"
            required
            searchable
            disabled={!form.values.department}
            data={titles}
            {...form.getInputProps('job_title')}
          />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Country"
            required
            searchable
            data={countryOptions(meta)}
            {...form.getInputProps('country')}
          />
          <Select
            label="Employment type"
            required
            allowDeselect={false}
            data={(meta?.employment_types ?? []).map((t: EmploymentType) => ({
              value: t,
              label: employmentTypeLabel(t),
            }))}
            {...form.getInputProps('employment_type')}
          />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Hire date" type="date" required {...form.getInputProps('hire_date')} />
          <NumberInput
            label={`Annual salary${currency ? ` (${currency})` : ''}`}
            description="Base salary in the country's local currency"
            required
            min={1}
            allowDecimal={false}
            allowNegative={false}
            thousandSeparator=","
            {...form.getInputProps('salary')}
          />
        </SimpleGrid>
        {salaryChanged && (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Reason for salary change"
              placeholder="e.g. Annual review, Promotion"
              required
              {...form.getInputProps('salary_change_reason')}
            />
            <TextInput
              label="Effective date"
              type="date"
              required
              {...form.getInputProps('salary_effective_date')}
            />
          </SimpleGrid>
        )}
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
