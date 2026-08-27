import { Card, Group, Text, Badge, Stack, Button } from '@mantine/core';
import {
  fmtMoney,
  fmtDateTime,
  STATUS_LABEL,
  STATUS_COLOR,
  TRIP_TYPE_LABEL,
} from '@/lib/format';

export default function BookingCard({ booking, onAccept, onReject, onQuote, busy, actionable }) {
  const b = booking;
  const isRoundTrip = b.tripType === 'round_trip';

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Text fw={600}>{b.customerName}</Text>
            <Badge variant="outline" color={isRoundTrip ? 'grape' : 'gray'} size="sm">
              {TRIP_TYPE_LABEL[b.tripType] ?? '單程'}
            </Badge>
          </Group>
          <Badge color={STATUS_COLOR[b.status]} variant="light">
            {STATUS_LABEL[b.status] ?? b.status}
          </Badge>
        </Group>

        <Text size="sm">
          {b.pickupLocation} → {b.destination}
        </Text>
        <Text size="sm" c="dimmed">
          去程 {fmtDateTime(b.bookingDate, b.bookingTime)}
          {isRoundTrip && b.returnDate ? `　回程 ${fmtDateTime(b.returnDate, b.returnTime)}` : ''}
        </Text>
        <Group gap="lg">
          <Text size="sm" c="dimmed">
            {b.passengerCount} 人
          </Text>
          <Text size="sm" c="dimmed">
            預估 {fmtMoney(b.estimatedPrice)}
          </Text>
          {b.quotedPrice != null && (
            <Text size="sm" c="orange.7" fw={600}>
              報價 {fmtMoney(b.quotedPrice)}
            </Text>
          )}
        </Group>

        {b.specialRequests && (
          <Text size="sm" c="dimmed">
            備註：{b.specialRequests}
          </Text>
        )}
        {b.quoteNote && (
          <Text size="sm" c="dimmed">
            報價說明：{b.quoteNote}
          </Text>
        )}
        {b.status === 'rejected' && b.rejectedReason && (
          <Text size="sm" c="red">
            拒絕原因：{b.rejectedReason}
          </Text>
        )}

        {actionable && b.status === 'pending' && (
          <Group mt="xs">
            <Button size="xs" color="green" loading={busy} onClick={() => onAccept?.(b)}>
              接受
            </Button>
            <Button size="xs" variant="light" color="orange" loading={busy} onClick={() => onQuote?.(b)}>
              重新報價
            </Button>
            <Button size="xs" variant="light" color="red" loading={busy} onClick={() => onReject?.(b)}>
              拒絕
            </Button>
          </Group>
        )}
        {b.status === 'quoted' && (
          <Text size="sm" c="orange.7">
            已報價 {fmtMoney(b.quotedPrice)}，等待客人確認
          </Text>
        )}
      </Stack>
    </Card>
  );
}
