import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MantineProvider>
      <QueryClientProvider client={client}>
        <ModalsProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>,
  )
}
