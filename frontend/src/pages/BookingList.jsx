import { useState } from 'react';
import { Stack, Title, SegmentedControl, Pagination, Group, Text } from '@mantine/core';
import { useCurrentDriverId } from '@/hooks/useAuth';
import {
  useDriverBookings,
  useAcceptBooking,
  useRejectBooking,
  useQuoteBooking,
  useCompleteBooking,
  useDeleteBooking,
} from '@/hooks/useBookings';
import BookingCard from '@/components/BookingCard';
import RejectBookingModal from '@/components/RejectBookingModal';
import QuoteModal from '@/components/QuoteModal';
import Spinner from '@/components/Spinner';
import { notifyOk, notifyErr } from '@/lib/notify';

const FILTERS = [
  { label: '待確認', value: 'pending' },
  { label: '報價中', value: 'quoted' },
  { label: '已接受', value: 'accepted' },
  { label: '已完成', value: 'completed' },
  { label: '全部', value: 'all' },
];
const PAGE_SIZE = 10;

export default function BookingList() {
  const driverId = useCurrentDriverId();
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [quoting, setQuoting] = useState(null);

  const status = filter === 'all' ? undefined : filter;
  const { data, isLoading, isFetching } = useDriverBookings(driverId, {
    status,
    page,
    pageSize: PAGE_SIZE,
  });
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const quote = useQuoteBooking();
  const complete = useCompleteBooking();
  const del = useDeleteBooking();
  const busy =
    accept.isPending || reject.isPending || quote.isPending || complete.isPending || del.isPending;

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / PAGE_SIZE));

  const changeFilter = (v) => {
    setFilter(v);
    setPage(1);
  };

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

  const doComplete = (b) => {
    if (!window.confirm('確認這筆行程已完成？完成後無法復原。')) return;
    complete.mutate(
      { bookingId: b.id },
      { onSuccess: (r) => notifyOk(r.message || '行程已完成'), onError: (e) => notifyErr(e) },
    );
  };

  const doDelete = (b) => {
    if (!window.confirm('確定刪除這筆行程？刪除後不會再出現在列表中。')) return;
    del.mutate(
      { bookingId: b.id },
      { onSuccess: (r) => notifyOk(r.message || '行程已刪除'), onError: (e) => notifyErr(e) },
    );
  };

  return (
    <Stack gap="md">
      <Title order={4}>預約列表</Title>
      <SegmentedControl fullWidth data={FILTERS} value={filter} onChange={changeFilter} />

      {isLoading ? (
        <Spinner />
      ) : data?.bookings.length ? (
        <Stack gap="sm" opacity={isFetching ? 0.6 : 1}>
          {data.bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              actionable
              busy={busy}
              onAccept={doAccept}
              onReject={(bk) => setRejecting(bk)}
              onQuote={(bk) => setQuoting(bk)}
              onComplete={doComplete}
              onDelete={doDelete}
            />
          ))}
        </Stack>
      ) : (
        <Text c="dimmed" size="sm">
          沒有符合條件的預約。
        </Text>
      )}

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      )}

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
