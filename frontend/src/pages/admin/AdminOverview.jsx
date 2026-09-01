import { Stack, Title, SimpleGrid, Box, Text, Group } from '@mantine/core';
import { useAdminOverview } from '@/hooks/useAdmin';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';

function Stat({ label, value }) {
  return (
    <Box style={{ border: '1px solid #E4E0D0', borderRadius: 12, padding: '14px 16px', background: '#fff' }}>
      <Text size="xs" c="dimmed" mb={4}>
        {label}
      </Text>
      <Text fw={700} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22 }}>
        {value}
      </Text>
    </Box>
  );
}

const STATUS_ORDER = ['pending', 'quoted', 'accepted', 'completed', 'rejected', 'cancelled'];
const STATUS_LABEL = {
  pending: '待確認',
  quoted: '報價中',
  accepted: '已接受',
  completed: '已完成',
  rejected: '已拒絕',
  cancelled: '已取消',
};

export default function AdminOverview() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading) return <Spinner />;

  const byStatus = data?.bookings?.byStatus ?? {};

  return (
    <Stack gap="md">
      <Title order={4}>總覽 · {data?.month}</Title>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Stat label="司機總數" value={data?.drivers?.total ?? 0} />
        <Stat label="本月活躍司機" value={data?.drivers?.activeThisMonth ?? 0} />
        <Stat label="本月預約數" value={data?.bookings?.total ?? 0} />
        <Stat label="本月 GMV" value={fmtMoney(data?.bookings?.gmv)} />
      </SimpleGrid>

      <Box>
        <Text size="sm" fw={600} c="#4A6152" mb="xs">
          本月預約狀態分佈
        </Text>
        <Group gap="lg">
          {STATUS_ORDER.map((s) => (
            <Text key={s} size="sm">
              {STATUS_LABEL[s]} <b>{byStatus[s] ?? 0}</b>
            </Text>
          ))}
        </Group>
      </Box>
    </Stack>
  );
}
