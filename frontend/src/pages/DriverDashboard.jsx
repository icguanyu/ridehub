import { useState } from 'react';
import { SimpleGrid, Stack, Title, Text, Alert, Group, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useDriverStats } from '@/hooks/useStats';
import { useDriverBookings, useAcceptBooking, useRejectBooking } from '@/hooks/useBookings';
import { useDriver } from '@/hooks/useDriver';
import StatCard from '@/components/StatCard';
import BookingCard from '@/components/BookingCard';
import RejectBookingModal from '@/components/RejectBookingModal';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { notifyOk, notifyErr } from '@/lib/notify';

export default function DriverDashboard() {
  const driverId = useCurrentDriverId();
  const driver = useDriver(driverId);
  const stats = useDriverStats(driverId);
  const pending = useDriverBookings(driverId, { status: 'pending', pageSize: 50 });
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const [rejecting, setRejecting] = useState(null);

  const needsSetup =
    driver.data && (!driver.data.basePrice || !driver.data.operatingHoursStart || !driver.data.lineId);

  const doAccept = (b) =>
    accept.mutate(
      { bookingId: b.id },
      {
        onSuccess: (r) => notifyOk(r.message || '已接受'),
        onError: (e) => notifyErr(e),
      },
    );

  const doReject = (reason) =>
    reject.mutate(
      { bookingId: rejecting.id, reason },
      {
        onSuccess: (r) => {
          notifyOk(r.message || '已拒絕');
          setRejecting(null);
        },
        onError: (e) => notifyErr(e),
      },
    );

  return (
    <Stack gap="lg">
      {needsSetup && (
        <Alert color="yellow" title="完成基本設定">
          <Group justify="space-between">
            <Text size="sm">建議先填寫定價、營運時間並綁定 LINE，才能正常收單。</Text>
            <Button size="xs" component={Link} to="/dashboard/edit">
              前往設定
            </Button>
          </Group>
        </Alert>
      )}

      <div>
        <Title order={4} mb="xs">
          本月統計
        </Title>
        {stats.isLoading ? (
          <Spinner />
        ) : (
          <SimpleGrid cols={{ base: 3 }} spacing="sm">
            <StatCard label="本月接單" value={stats.data?.totalBookings ?? 0} sub={`成交 ${stats.data?.acceptedBookings ?? 0}`} />
            <StatCard label="平均評分" value={stats.data?.avgRating ? `${stats.data.avgRating} ⭐` : '—'} />
            <StatCard label="本月收入" value={fmtMoney(stats.data?.totalRevenue)} />
          </SimpleGrid>
        )}
      </div>

      <div>
        <Title order={4} mb="xs">
          待確認預約
        </Title>
        {pending.isLoading ? (
          <Spinner />
        ) : pending.data?.bookings.length ? (
          <Stack gap="sm">
            {pending.data.bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                actionable
                busy={accept.isPending || reject.isPending}
                onAccept={doAccept}
                onReject={(bk) => setRejecting(bk)}
              />
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" size="sm">
            目前沒有待確認的預約。
          </Text>
        )}
      </div>

      <RejectBookingModal
        opened={Boolean(rejecting)}
        booking={rejecting}
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={doReject}
      />
    </Stack>
  );
}
