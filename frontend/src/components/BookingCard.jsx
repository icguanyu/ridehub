import { Card, Group, Text, Badge, Stack, Button } from '@mantine/core';
import { fmtMoney, fmtDateTime, STATUS_LABEL, STATUS_COLOR } from '@/lib/format';

export default function BookingCard({ booking, onAccept, onReject, busy, actionable }) {
  const b = booking;
  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600}>{b.customerName}</Text>
          <Badge color={STATUS_COLOR[b.status]} variant="light">
            {STATUS_LABEL[b.status] ?? b.status}
          </Badge>
        </Group>

        <Text size="sm">
          {b.pickupLocation} → {b.destination}
        </Text>
        <Group gap="lg">
          <Text size="sm" c="dimmed">
            {fmtDateTime(b.bookingDate, b.bookingTime)}
          </Text>
          <Text size="sm" c="dimmed">
            {b.passengerCount} 人
          </Text>
          <Text size="sm" c="dimmed">
            {fmtMoney(b.estimatedPrice)}
          </Text>
        </Group>

        {b.specialRequests && (
          <Text size="sm" c="dimmed">
            備註：{b.specialRequests}
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
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={busy}
              onClick={() => onReject?.(b)}
            >
              拒絕
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
