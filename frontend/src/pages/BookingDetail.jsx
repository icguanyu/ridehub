import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Button, Text, Card, Group } from '@mantine/core';
import { useCurrentDriverId } from '@/hooks/useAuth';
import {
  useDriverBookings,
  useAcceptBooking,
  useRejectBooking,
  useQuoteBooking,
} from '@/hooks/useBookings';
import BookingCard from '@/components/BookingCard';
import RejectBookingModal from '@/components/RejectBookingModal';
import QuoteModal from '@/components/QuoteModal';
import Spinner from '@/components/Spinner';
import { notifyOk, notifyErr } from '@/lib/notify';

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const driverId = useCurrentDriverId();
  const { data, isLoading } = useDriverBookings(driverId, { pageSize: 100 });
  const accept = useAcceptBooking();
  const reject = useRejectBooking();
  const quote = useQuoteBooking();
  const [rejecting, setRejecting] = useState(false);
  const [quoting, setQuoting] = useState(false);

  if (isLoading) return <Spinner />;

  const booking = data?.bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <Card withBorder radius="md" p="lg">
        <Text c="dimmed">找不到這筆預約。</Text>
        <Button mt="md" variant="light" onClick={() => navigate('/dashboard/bookings')}>
          回列表
        </Button>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <Button variant="subtle" size="xs" onClick={() => navigate('/dashboard/bookings')}>
          ← 回列表
        </Button>
      </Group>
      <Title order={4}>預約詳情</Title>

      <BookingCard
        booking={booking}
        actionable
        busy={accept.isPending || reject.isPending || quote.isPending}
        onAccept={(b) =>
          accept.mutate(
            { bookingId: b.id },
            { onSuccess: (r) => notifyOk(r.message || '已接受'), onError: (e) => notifyErr(e) },
          )
        }
        onReject={() => setRejecting(true)}
        onQuote={() => setQuoting(true)}
      />

      <Card withBorder radius="md" p="md">
        <Stack gap={4}>
          <Text size="sm">客人電話：{booking.customerPhone}</Text>
          {booking.customerLineId && (
            <Text size="sm">客人 LINE：{booking.customerLineId}</Text>
          )}
          <Text size="sm" c="dimmed">
            建立時間：{new Date(booking.createdAt).toLocaleString('zh-TW')}
          </Text>
        </Stack>
      </Card>

      <RejectBookingModal
        opened={rejecting}
        booking={booking}
        busy={reject.isPending}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) =>
          reject.mutate(
            { bookingId: booking.id, reason },
            {
              onSuccess: (r) => {
                notifyOk(r.message || '已拒絕');
                setRejecting(false);
              },
              onError: (e) => notifyErr(e),
            },
          )
        }
      />
      <QuoteModal
        opened={quoting}
        booking={booking}
        busy={quote.isPending}
        onClose={() => setQuoting(false)}
        onConfirm={({ price, note }) =>
          quote.mutate(
            { bookingId: booking.id, price, note },
            {
              onSuccess: (r) => {
                notifyOk(r.message || '報價已送出');
                setQuoting(false);
              },
              onError: (e) => notifyErr(e),
            },
          )
        }
      />
    </Stack>
  );
}
