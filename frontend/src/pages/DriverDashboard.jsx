import { useState } from 'react';
import { Stack, Text, Alert, Group, Button, Box, Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useCurrentDriverId } from '@/hooks/useAuth';
import {
  useDriverBookings,
  useAcceptBooking,
  useRejectBooking,
  useQuoteBooking,
  useCompleteBooking,
} from '@/hooks/useBookings';
import { useDriverStats } from '@/hooks/useStats';
import { useDriver } from '@/hooks/useDriver';
import BookingCard from '@/components/BookingCard';
import TripRoute, { TripTypeBadge } from '@/components/TripRoute';
import RejectBookingModal from '@/components/RejectBookingModal';
import QuoteModal from '@/components/QuoteModal';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { notifyOk, notifyErr } from '@/lib/notify';

const OUTSTANDING = ['pending', 'quoted'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function minutesUntil(date, time) {
  const t = (time ?? '00:00:00').slice(0, 8);
  return Math.round((new Date(`${date}T${t}`) - new Date()) / 60000);
}

function getCountdownBadge(booking) {
  if (booking.bookingDate !== todayISO()) {
    return { label: '已確認', color: 'brand', variant: 'outline' };
  }
  const mins = minutesUntil(booking.bookingDate, booking.bookingTime);
  if (mins < 0) return { label: '進行中', color: 'leaf', variant: 'filled' };
  if (mins <= 60) return { label: `${mins}分鐘後`, color: 'sun', variant: 'filled' };
  return { label: '已確認', color: 'brand', variant: 'outline' };
}

function TripCard({ booking, showNav, showContact, showComplete, onComplete, busy }) {
  const b = booking;
  const badge = getCountdownBadge(b);
  const time = (b.bookingTime ?? '').slice(0, 5);
  const isRoundTrip = b.tripType === 'round_trip';
  const hasActions = showNav || showContact || showComplete;

  const openNav = () => {
    const q = encodeURIComponent(b.pickupLocation);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box style={{ border: '1px solid #E4E0D0', borderRadius: 16, padding: '14px 16px', background: '#FFFFFF' }}>
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Group gap={8} wrap="nowrap" align="center">
          <Text
            fw={700}
            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {time}
          </Text>
          {isRoundTrip && <TripTypeBadge tripType={b.tripType} />}
        </Group>
        <Badge color={badge.color} variant={badge.variant} size="md">
          {badge.label}
        </Badge>
      </Group>

      <Box mb={6}>
        <TripRoute booking={b} timeMode="omitOutbound" />
      </Box>

      <Text size="sm" c="dimmed" mb={hasActions ? 12 : 0}>
        {b.customerName} · {b.passengerCount}人
      </Text>

      {hasActions && (
        <Stack gap={8}>
          {(showNav || showContact) && (
            <Group gap={8}>
              {showNav && (
                <Button flex={1} color="brand" size="sm" onClick={openNav}>
                  開始導航
                </Button>
              )}
              {showContact &&
                (b.customerPhone ? (
                  <Button flex={1} variant="default" size="sm" component="a" href={`tel:${b.customerPhone}`}>
                    聯絡乘客
                  </Button>
                ) : (
                  <Button flex={1} variant="default" size="sm" disabled>
                    聯絡乘客
                  </Button>
                ))}
            </Group>
          )}
          {showComplete && (
            <Button
              fullWidth
              variant="light"
              color="leaf"
              size="sm"
              loading={busy}
              onClick={() => onComplete?.(b)}
            >
              完成行程
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}

function SectionTitle({ children }) {
  return (
    <Text fw={600} size="sm" mb={10} style={{ color: '#4A6152' }}>
      {children}
    </Text>
  );
}

function EmptyBox({ children }) {
  return (
    <Box
      style={{
        border: '1px solid #E4E0D0',
        borderRadius: 16,
        padding: '20px 16px',
        textAlign: 'center',
        background: '#FFFFFF',
      }}
    >
      <Text c="dimmed" size="sm">
        {children}
      </Text>
    </Box>
  );
}

export default function DriverDashboard() {
  const driverId = useCurrentDriverId();
  const driver = useDriver(driverId);
  const stats = useDriverStats(driverId);
  const bookings = useDriverBookings(driverId, { pageSize: 50 });
  const acceptedQ = useDriverBookings(driverId, { status: 'accepted', pageSize: 50 });
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const quote = useQuoteBooking();
  const complete = useCompleteBooking();
  const [rejecting, setRejecting] = useState(null);
  const [quoting, setQuoting] = useState(null);

  const needsSetup =
    driver.data && (!driver.data.basePrice || !driver.data.lineId);

  const busy = accept.isPending || reject.isPending || quote.isPending || complete.isPending;
  const outstanding = (bookings.data?.bookings ?? []).filter((b) => OUTSTANDING.includes(b.status));

  const t = todayISO();
  const accepted = (acceptedQ.data?.bookings ?? [])
    .filter((b) => b.bookingDate >= t)
    .sort((a, b) =>
      `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`),
    );
  const todayTrips = accepted.filter((b) => b.bookingDate === t);
  const soonTrips = accepted.filter((b) => b.bookingDate > t);

  const doAccept = (b) =>
    accept.mutate(
      { bookingId: b.id },
      { onSuccess: (r) => notifyOk(r.message || '已接受'), onError: (e) => notifyErr(e) },
    );

  const doReject = (reason) =>
    reject.mutate(
      { bookingId: rejecting.id, reason },
      {
        onSuccess: (r) => { notifyOk(r.message || '已拒絕'); setRejecting(null); },
        onError: (e) => notifyErr(e),
      },
    );

  const doQuote = ({ price, note }) =>
    quote.mutate(
      { bookingId: quoting.id, price, note },
      {
        onSuccess: (r) => { notifyOk(r.message || '報價已送出'); setQuoting(null); },
        onError: (e) => notifyErr(e),
      },
    );

  const doComplete = (b) => {
    if (!window.confirm('確認這筆行程已完成？完成後無法復原。')) return;
    complete.mutate(
      { bookingId: b.id },
      { onSuccess: (r) => notifyOk(r.message || '行程已完成'), onError: (e) => notifyErr(e) },
    );
  };

  return (
    <Stack gap="md">
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

      {/* 本月收益卡 */}
      {stats.isLoading ? (
        <Spinner />
      ) : (
        <Box style={{ background: '#0F3D2E', borderRadius: 16, padding: '20px 24px 22px' }}>
          <Text size="sm" mb={6} style={{ color: '#8BC34A', fontWeight: 500 }}>
            本月已完成
          </Text>
          <Text
            fw={700}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 36,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            {fmtMoney(stats.data?.totalRevenue)}
          </Text>
          <Text size="sm" mt={6} style={{ color: '#8BC34A' }}>
            {stats.data?.acceptedBookings ?? 0} 趟已成交
            {stats.data?.totalCustomers > 0 && ` · ${stats.data.totalCustomers} 位乘客`}
          </Text>
        </Box>
      )}

      {/* 今日待出發 / 即將到來 */}
      {acceptedQ.isLoading ? (
        <Spinner />
      ) : (
        <>
          <div>
            <SectionTitle>今日待出發</SectionTitle>
            {todayTrips.length > 0 ? (
              <Stack gap="sm">
                {todayTrips.map((b) => (
                  <TripCard
                    key={b.id}
                    booking={b}
                    showNav
                    showContact
                    showComplete
                    onComplete={doComplete}
                    busy={busy}
                  />
                ))}
              </Stack>
            ) : (
              <EmptyBox>今日沒有待出發行程</EmptyBox>
            )}
          </div>

          <div>
            <SectionTitle>即將到來</SectionTitle>
            {soonTrips.length > 0 ? (
              <Stack gap="sm">
                {soonTrips.map((b) => (
                  <TripCard key={b.id} booking={b} showContact />
                ))}
              </Stack>
            ) : (
              <EmptyBox>沒有即將到來的行程</EmptyBox>
            )}
          </div>
        </>
      )}

      {/* 待處理預約 */}
      <div>
        <SectionTitle>待處理預約</SectionTitle>
        {bookings.isLoading ? (
          <Spinner />
        ) : outstanding.length > 0 ? (
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
          <EmptyBox>目前沒有待處理的預約</EmptyBox>
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
