import { Alert, Center, Loader } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { ReactNode } from 'react'

/** Uniform loading / error rendering for a query-backed section. */
export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean
  error: Error | null
  children: ReactNode
}) {
  if (isLoading)
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    )
  if (error)
    return (
      <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Couldn't load data">
        {error.message}
      </Alert>
    )
  return <>{children}</>
}
