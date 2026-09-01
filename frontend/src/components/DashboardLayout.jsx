import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Text, ActionIcon, Container, Tooltip, Anchor } from '@mantine/core';
import { useAuthStore } from '@/store/authStore';
import Wordmark from '@/components/Wordmark';

function IconCar({ active }) {
  const c = active ? '#0F3D2E' : '#4A6152';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l3-4h12l3 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}

function IconCalendar({ active }) {
  const c = active ? '#0F3D2E' : '#4A6152';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconCard({ active }) {
  const c = active ? '#0F3D2E' : '#4A6152';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconChart({ active }) {
  const c = active ? '#0F3D2E' : '#4A6152';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <rect x="7" y="13" width="3" height="5" rx="0.5" />
      <rect x="12.5" y="9" width="3" height="9" rx="0.5" />
      <rect x="18" y="6" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A6152" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const tabs = [
  { value: '/dashboard', label: '總覽', Icon: IconCar },
  { value: '/dashboard/bookings', label: '預約', Icon: IconCalendar },
  { value: '/dashboard/stats', label: '統計', Icon: IconChart },
  { value: '/dashboard/edit', label: '服務', Icon: IconCard },
];

function activeTab(pathname) {
  const match = [...tabs]
    .sort((a, b) => b.value.length - a.value.length)
    .find((t) => pathname === t.value || pathname.startsWith(t.value + '/'));
  return match?.value ?? '/dashboard';
}

export default function DashboardLayout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeTab(pathname);

  return (
    <AppShell
      header={{ height: 56 }}
      footer={{ height: 64 }}
      padding="md"
      styles={{
        header: { borderBottom: '1px solid #E4E0D0', background: '#FAF7EB' },
        footer: { borderTop: '1px solid #E4E0D0', background: '#FAF7EB' },
        main: { background: '#FAF7EB' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Wordmark size={20} withMark markSize={26} />
          <Group gap={2}>
            <Tooltip label="前往首頁" withArrow position="bottom-end">
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label="前往首頁" onClick={() => navigate('/')}>
                <IconHome />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="登出" withArrow position="bottom-end">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="登出"
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
              >
                <IconLogout />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="sm" px={0}>
          <Outlet />
          <Group justify="center" gap={10} mt="xl" pt="md" style={{ borderTop: '1px solid #E4E0D0' }}>
            <Anchor component={Link} to="/privacy" size="xs" c="dimmed">
              隱私說明
            </Anchor>
            <Text size="xs" c="dimmed">·</Text>
            <Anchor component={Link} to="/disclaimer" size="xs" c="dimmed">
              使用須知
            </Anchor>
          </Group>
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" justify="space-around" align="center">
          {tabs.map(({ value, label, Icon }) => {
            const isActive = active === value;
            return (
              <UnstyledButton
                key={value}
                onClick={() => navigate(value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '6px 10px',
                  borderRadius: 10,
                }}
              >
                <Icon active={isActive} />
                <Text size="10px" fw={isActive ? 700 : 400} c={isActive ? '#0F3D2E' : '#4A6152'}>
                  {label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
