import { useState, useEffect } from 'react';
import { Stack, Title, Group, ActionIcon, Text, Box, Button } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useDriverStats } from '@/hooks/useStats';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { todayISO } from '@/lib/tz';

const thisMonth = () => todayISO().slice(0, 7); // 營運時區的 YYYY-MM

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function label(ym) {
  const [y, m] = ym.split('-');
  return `${y} 年 ${Number(m)} 月`;
}

function Metric({ title, value, accent }) {
  return (
    <Box
      style={{
        border: '1px solid #E4E0D0',
        borderRadius: 16,
        padding: '16px 18px',
        background: '#FFFFFF',
      }}
    >
      <Text size="xs" c="dimmed" mb={4}>
        {title}
      </Text>
      <Text
        fw={700}
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 24,
          letterSpacing: '-0.02em',
          color: accent ? '#0F3D2E' : '#1c1c1c',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Text>
    </Box>
  );
}

export default function DriverStats() {
  const driverId = useCurrentDriverId();
  const [displayMonth, setDisplayMonth] = useState(thisMonth());
  const [queryMonth, setQueryMonth] = useState(thisMonth());
  const { data, isLoading, isFetching } = useDriverStats(driverId, queryMonth);

  useEffect(() => {
    const t = setTimeout(() => setQueryMonth(displayMonth), 600);
    return () => clearTimeout(t);
  }, [displayMonth]);

  const atCurrent = displayMonth >= thisMonth();
  const notCurrentMonth = displayMonth !== thisMonth();

  const goToCurrentMonth = () => {
    const cur = thisMonth();
    setDisplayMonth(cur);
    setQueryMonth(cur);
  };

  return (
    <Stack gap="md">
      <Title order={4}>統計</Title>

      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap">
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="上個月"
            onClick={() => setDisplayMonth((m) => shiftMonth(m, -1))}
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Text fw={700} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18 }}>
            {label(displayMonth)}
          </Text>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="下個月"
            disabled={atCurrent}
            onClick={() => setDisplayMonth((m) => shiftMonth(m, 1))}
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
        {notCurrentMonth && (
          <Group justify="center">
            <Button variant="subtle" size="compact-xs" c="dimmed" onClick={goToCurrentMonth}>
              回本月
            </Button>
          </Group>
        )}
      </Stack>

      {isLoading ? (
        <Spinner />
      ) : (
        <Stack gap="sm" opacity={isFetching ? 0.6 : 1}>
          <Metric accent title="營收" value={fmtMoney(data?.totalRevenue)} />
          <Group grow>
            <Metric title="成交趟數" value={data?.acceptedBookings ?? 0} />
            <Metric title="乘客數" value={data?.totalCustomers ?? 0} />
          </Group>
          <Group grow>
            <Metric title="總預約數" value={data?.totalBookings ?? 0} />
            <Metric title="平均評分(敬請期待)" value={data?.avgRating ? data.avgRating.toFixed(1) : '—'} />
          </Group>
        </Stack>
      )}

      <Text size="xs" c="dimmed">
        以行程日期歸月；取消／刪除的行程不計入。營收 = 成交（已接受＋已完成）行程的成交價總和。
      </Text>
    </Stack>
  );
}
