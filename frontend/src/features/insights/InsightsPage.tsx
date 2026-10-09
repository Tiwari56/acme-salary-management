import { BarChart } from '@mantine/charts'
import { Group, Paper, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useState } from 'react'

import {
  useByCountry,
  useByDepartment,
  useByJobTitle,
  useDistribution,
  useMeta,
  useSummary,
} from '../../api/hooks'
import { QueryState } from '../../components/QueryState'
import { StatTile } from '../../components/StatTile'
import { formatCompactUsd, formatMoney, formatNumber } from '../../lib/format'
import { countryOptions } from '../../lib/options'

const SERIES_COLOR = 'var(--series-1)'
const num = { fontVariantNumeric: 'tabular-nums' } as const

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p="md">
      <Title order={4}>{title}</Title>
      {subtitle && (
        <Text size="sm" c="dimmed" mb="sm">
          {subtitle}
        </Text>
      )}
      {children}
    </Paper>
  )
}

export function InsightsPage() {
  const { data: meta } = useMeta()
  const [country, setCountry] = useState<string | null>(null)
  const scope = country ?? undefined
  const countryName = meta?.countries.find((c) => c.code === country)?.name

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Pay insights</Title>
          <Text c="dimmed" size="sm">
            Annual base salary. Cross-country figures in USD at fixed reference rates
            {meta ? ` (as of ${meta.rates_as_of})` : ''}.
          </Text>
        </div>
        <Select
          aria-label="Scope insights to a country"
          placeholder="All countries"
          clearable
          data={countryOptions(meta)}
          value={country}
          onChange={setCountry}
          w={240}
        />
      </Group>

      <SummaryTiles country={scope} />
      {!country && <CountryBreakdown />}
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <DepartmentChart country={scope} scopeLabel={countryName} />
        <DistributionChart country={scope} scopeLabel={countryName} />
      </SimpleGrid>
      <JobTitleTable country={country} onCountryChange={setCountry} />
    </Stack>
  )
}

function SummaryTiles({ country }: { country?: string }) {
  const { data, isLoading, error } = useSummary(country)
  return (
    <QueryState isLoading={isLoading} error={error}>
      {data && (
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <StatTile label="Headcount" value={formatNumber(data.headcount)} hint={`${data.countries} countries`} />
          <StatTile label="Annual payroll" value={formatCompactUsd(data.payroll_usd)} hint="USD" />
          <StatTile label="Median salary" value={formatMoney(data.median_usd, 'USD')} hint="Typical employee" />
          <StatTile
            label="Mean salary"
            value={formatMoney(data.mean_usd, 'USD')}
            hint={data.mean_usd > data.median_usd ? 'Above median: pay is right-skewed' : undefined}
          />
        </SimpleGrid>
      )}
    </QueryState>
  )
}

function CountryBreakdown() {
  const { data, isLoading, error } = useByCountry()
  return (
    <Section title="Pay by country" subtitle="Sorted by total payroll. Local currency is what employees are paid in.">
      <QueryState isLoading={isLoading} error={error}>
        <Table.ScrollContainer minWidth={720}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th ta="right">Headcount</Table.Th>
                <Table.Th ta="right">Payroll (USD)</Table.Th>
                <Table.Th ta="right">Median (USD)</Table.Th>
                <Table.Th ta="right">Median (local)</Table.Th>
                <Table.Th ta="right">Range (local)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.map((c) => (
                <Table.Tr key={c.country}>
                  <Table.Td>{c.country_name}</Table.Td>
                  <Table.Td ta="right" style={num}>{formatNumber(c.usd.count)}</Table.Td>
                  <Table.Td ta="right" style={num}>{formatCompactUsd(c.usd.total)}</Table.Td>
                  <Table.Td ta="right" style={num}>{formatMoney(c.usd.median, 'USD')}</Table.Td>
                  <Table.Td ta="right" style={num}>{formatMoney(c.local.median, c.currency)}</Table.Td>
                  <Table.Td ta="right" style={num}>
                    {formatMoney(c.local.min, c.currency)} – {formatMoney(c.local.max, c.currency)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </QueryState>
    </Section>
  )
}

function DepartmentChart({ country, scopeLabel }: { country?: string; scopeLabel?: string }) {
  const { data, isLoading, error } = useByDepartment(country)
  const rows = (data ?? []).map((d) => ({ department: d.department, median: d.usd.median, headcount: d.usd.count }))
  return (
    <Section title="Median salary by department" subtitle={`USD · ${scopeLabel ?? 'all countries'}`}>
      <QueryState isLoading={isLoading} error={error}>
        <BarChart
          h={300}
          data={rows}
          dataKey="department"
          orientation="vertical"
          yAxisProps={{ width: 130 }}
          series={[{ name: 'median', label: 'Median salary', color: SERIES_COLOR }]}
          valueFormatter={(v) => formatCompactUsd(v)}
          gridAxis="none"
          barProps={{ radius: [0, 4, 4, 0] }}
        />
      </QueryState>
    </Section>
  )
}

function DistributionChart({ country, scopeLabel }: { country?: string; scopeLabel?: string }) {
  const { data, isLoading, error } = useDistribution(country)
  const rows = (data?.buckets ?? []).map((b, i, all) => ({
    band: i === all.length - 1 && all.length >= 30 ? `${formatCompactUsd(b.lower)}+` : formatCompactUsd(b.lower),
    employees: b.count,
  }))
  return (
    <Section
      title="Salary distribution"
      subtitle={`Employees per ${data ? formatCompactUsd(data.bucket_size) : ''} USD band · ${scopeLabel ?? 'all countries'}`}
    >
      <QueryState isLoading={isLoading} error={error}>
        <BarChart
          h={300}
          data={rows}
          dataKey="band"
          series={[{ name: 'employees', label: 'Employees', color: SERIES_COLOR }]}
          valueFormatter={(v) => formatNumber(v)}
          gridAxis="y"
          barProps={{ radius: [4, 4, 0, 0] }}
        />
      </QueryState>
    </Section>
  )
}

function JobTitleTable({
  country,
  onCountryChange,
}: {
  country: string | null
  onCountryChange: (c: string | null) => void
}) {
  const { data: meta } = useMeta()
  const { data, isLoading, error } = useByJobTitle(country ?? undefined)
  return (
    <Section title="Pay by job title" subtitle="Within one country, in local currency — the comparison HR uses for pay bands.">
      {!country ? (
        <Group>
          <Text size="sm" c="dimmed">
            Pick a country to compare job titles:
          </Text>
          <Select
            aria-label="Country for job title breakdown"
            placeholder="Select country"
            data={countryOptions(meta)}
            value={country}
            onChange={onCountryChange}
            w={240}
          />
        </Group>
      ) : (
        <QueryState isLoading={isLoading} error={error}>
          <Table.ScrollContainer minWidth={760}>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Job title</Table.Th>
                  <Table.Th>Department</Table.Th>
                  <Table.Th ta="right">Headcount</Table.Th>
                  <Table.Th ta="right">Min</Table.Th>
                  <Table.Th ta="right">Median</Table.Th>
                  <Table.Th ta="right">Average</Table.Th>
                  <Table.Th ta="right">Max</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.items.map((t) => (
                  <Table.Tr key={t.job_title}>
                    <Table.Td>{t.job_title}</Table.Td>
                    <Table.Td c="dimmed">{t.department}</Table.Td>
                    <Table.Td ta="right" style={num}>{formatNumber(t.local.count)}</Table.Td>
                    <Table.Td ta="right" style={num}>{formatMoney(t.local.min, data.currency)}</Table.Td>
                    <Table.Td ta="right" style={num} fw={600}>{formatMoney(t.local.median, data.currency)}</Table.Td>
                    <Table.Td ta="right" style={num}>{formatMoney(t.local.mean, data.currency)}</Table.Td>
                    <Table.Td ta="right" style={num}>{formatMoney(t.local.max, data.currency)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </QueryState>
      )}
    </Section>
  )
}
