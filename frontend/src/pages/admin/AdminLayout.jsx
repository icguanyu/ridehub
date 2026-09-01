import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppShell, Group, Button, Text } from '@mantine/core';
import { useAdminAuthStore } from '@/store/adminAuthStore';

const links = [
  { to: '/admin', label: '總覽', end: true },
  { to: '/admin/drivers', label: '司機' },
  { to: '/admin/bookings', label: '預約' },
  { to: '/admin/verifications', label: '驗證審核' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const email = useAdminAuthStore((s) => s.email);
  const logout = useAdminAuthStore((s) => s.logout);

  return (
    <AppShell header={{ height: 52 }} padding="md" styles={{ main: { background: '#FAF7EB' } }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <Text fw={700} style={{ fontFamily: "'Outfit', sans-serif" }}>
              RideHub Admin
            </Text>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                style={({ isActive }) => ({
                  fontSize: 14,
                  textDecoration: 'none',
                  color: isActive ? '#0F3D2E' : '#4A6152',
                  fontWeight: isActive ? 700 : 400,
                })}
              >
                {l.label}
              </NavLink>
            ))}
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Text size="xs" c="dimmed" visibleFrom="sm">
              {email}
            </Text>
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              onClick={() => {
                logout();
                navigate('/admin/login', { replace: true });
              }}
            >
              登出
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
