import { Paper, Text } from '@mantine/core'
import type { ReactNode } from 'react'

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fz={28} fw={700} mt={4} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      )}
    </Paper>
  )
}
