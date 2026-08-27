import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, Group, Text, Button, Tabs, Container } from '@mantine/core';
import { useAuthStore } from '@/store/authStore';

const tabs = [
  { value: '/dashboard', label: '總覽' },
  { value: '/dashboard/bookings', label: '預約' },
  { value: '/dashboard/edit', label: '服務資訊' },
  { value: '/dashboard/availability', label: '時間設定' },
];

// 目前路徑對應到哪個分頁（子路徑如 /dashboard/bookings/:id 也算在「預約」）
function activeTab(pathname) {
  const match = [...tabs]
    .sort((a, b) => b.value.length - a.value.length)
    .find((t) => pathname === t.value || pathname.startsWith(t.value + '/'));
  return match?.value ?? '/dashboard';
}

export default function DashboardLayout() {
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fw={700} c="blue.6">
              RideHub
            </Text>
            <Text size="xs" c="dimmed">
              {driver?.name ? `${driver.name} 司機後台` : '司機後台'}
            </Text>
          </Group>
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            登出
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="sm" px={0}>
          <Tabs value={activeTab(pathname)} onChange={(v) => navigate(v)} mb="lg" variant="pills">
            <Tabs.List grow>
              {tabs.map((t) => (
                <Tabs.Tab key={t.value} value={t.value}>
                  {t.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
