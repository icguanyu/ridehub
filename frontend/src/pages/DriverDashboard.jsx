import { useState } from 'react';
import { SimpleGrid, Stack, Title, Text, Alert, Group, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useDriverStats } from '@/hooks/useStats';
import {
  useDriverBookings,
  useAcceptBooking,
  useRejectBooking,
  useQuoteBooking,
} from '@/hooks/useBookings';
import { useDriver } from '@/hooks/useDriver';
import StatCard from '@/components/StatCard';
import BookingCard from '@/components/BookingCard';
import RejectBookingModal from '@/components/RejectBookingModal';
import QuoteModal from '@/components/QuoteModal';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { notifyOk, notifyErr } from '@/lib/notify';

const OUTSTANDING = ['pending', 'quoted'];

export default function DriverDashboard() {
  const driverId = useCurrentDriverId();
  const driver = useDriver(driverId);
  const stats = useDriverStats(driverId);
  const bookings = useDriverBookings(driverId, { pageSize: 50 });
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const quote = useQuoteBooking();
  const [rejecting, setRejecting] = useState(null);
  const [quoting, setQuoting] = useState(null);

  const busy = accept.isPending || reject.isPending || quote.isPending;
  const outstanding = (bookings.data?.bookings ?? []).filter((b) => OUTSTANDING.includes(b.status));

  const needsSetup =
    driver.data && (!driver.data.basePrice || !driver.data.operatingHoursStart || !driver.data.lineId);

  const doAccept = (b) =>
    accept.mutate(
      { bookingId: b.id },
      { onSuccess: (r) => notifyOk(r.message || '已接受'), onError: (e) => notifyErr(e) },
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

  const doQuote = ({ price, note }) =>
    quote.mutate(
      { bookingId: quoting.id, price, note },
      {
        onSuccess: (r) => {
          notifyOk(r.message || '報價已送出');
          setQuoting(null);
        },
        onError: (e) => notifyErr(e),
      },
    );

  return (
    <Stack gap="lg">
      {needsSetup && (
        <Alert color="sun" title="完成基本設定">
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
            <StatCard
              label="本月接單"
              value={stats.data?.totalBookings ?? 0}
              sub={`成交 ${stats.data?.acceptedBookings ?? 0}`}
            />
            <StatCard label="平均評分" value={stats.data?.avgRating ? `${stats.data.avgRating} ⭐` : '—'} />
            <StatCard label="本月收入" value={fmtMoney(stats.data?.totalRevenue)} />
          </SimpleGrid>
        )}
      </div>

      <div>
        <Title order={4} mb="xs">
          待處理預約
        </Title>
        {bookings.isLoading ? (
          <Spinner />
        ) : outstanding.length ? (
          <Stack gap="sm">
            {outstanding.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                actionable
                busy={busy}
                onAccept={doAccept}
                onReject={(bk) => setRejecting(bk)}
                onQuote={(bk) => setQuoting(bk)}
              />
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" size="sm">
            目前沒有待處理的預約。
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
      <QuoteModal
        opened={Boolean(quoting)}
        booking={quoting}
        busy={quote.isPending}
        onClose={() => setQuoting(null)}
        onConfirm={doQuote}
      />
    </Stack>
  );
}
