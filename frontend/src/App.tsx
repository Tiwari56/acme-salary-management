import { AppShell, Burger, Center, Group, Loader, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChartBar, IconUsers } from '@tabler/icons-react'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { ColorSchemeToggle } from './components/ColorSchemeToggle'
import { EmployeesPage } from './features/employees/EmployeesPage'

// Charts (recharts) are only needed on the insights page; keep them out of the initial bundle.
const InsightsPage = lazy(() =>
  import('./features/insights/InsightsPage').then((m) => ({ default: m.InsightsPage })),
)

const NAV = [
  { to: '/employees', label: 'Employees', icon: IconUsers },
  { to: '/insights', label: 'Pay insights', icon: IconChartBar },
]

export default function App() {
  const [opened, { toggle, close }] = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>ACME Pay</Title>
            <Text size="sm" c="dimmed" visibleFrom="xs">
              Salary management
            </Text>
          </Group>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            label={label}
            leftSection={<Icon size={18} />}
            active={location.pathname.startsWith(to)}
            onClick={() => {
              navigate(to)
              close()
            }}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Suspense
          fallback={
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          }
        >
          <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
          </Routes>
        </Suspense>
      </AppShell.Main>
    </AppShell>
  )
}
