import { Card, Group, Text, Badge, Stack, Button } from '@mantine/core';
import { fmtMoney, fmtDateTime, STATUS_LABEL, STATUS_COLOR, TRIP_TYPE_LABEL } from '@/lib/format';

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="#2E7D32"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', marginTop: 3 }}
      aria-hidden
    >
      <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export default function BookingCard({ booking, onAccept, onReject, onQuote, busy, actionable }) {
  const b = booking;
  const isRoundTrip = b.tripType === 'round_trip';

  return (
    <Card radius="lg" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap={8}>
            <Text fw={700}>{b.customerName}</Text>
            <Badge variant="outline" color={isRoundTrip ? 'brand' : 'gray'} size="sm">
              {TRIP_TYPE_LABEL[b.tripType] ?? '單程'}
            </Badge>
          </Group>
          <Badge color={STATUS_COLOR[b.status]} variant="light">
            {STATUS_LABEL[b.status] ?? b.status}
          </Badge>
        </Group>

        <Group gap={8} align="flex-start" wrap="nowrap">
          <PinIcon />
          <div>
            <Text size="sm" fw={500}>
              {b.pickupLocation} → {b.destination}
            </Text>
            <Text size="sm" c="dimmed" className="mono">
              去程 {fmtDateTime(b.bookingDate, b.bookingTime)}
              {isRoundTrip && b.returnDate ? `　回程 ${fmtDateTime(b.returnDate, b.returnTime)}` : ''}
            </Text>
          </div>
        </Group>

        <Group gap="lg">
          <Text size="sm" c="dimmed">
            {b.passengerCount} 人
          </Text>
          <Text size="sm" c="dimmed">
            預估 <span className="mono">{fmtMoney(b.estimatedPrice)}</span>
          </Text>
          {b.quotedPrice != null && (
            <Text size="sm" fw={700} style={{ color: '#c26f12' }}>
              報價 <span className="mono">{fmtMoney(b.quotedPrice)}</span>
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
          <Text size="sm" c="danger.6">
            拒絕原因：{b.rejectedReason}
          </Text>
        )}

        {actionable && b.status === 'pending' && (
          <Group mt="xs" gap="xs">
            <Button size="xs" color="brand" loading={busy} onClick={() => onAccept?.(b)}>
              接受
            </Button>
            <Button size="xs" variant="light" color="sun" loading={busy} onClick={() => onQuote?.(b)}>
              重新報價
            </Button>
            <Button size="xs" variant="default" loading={busy} onClick={() => onReject?.(b)}>
              拒絕
            </Button>
          </Group>
        )}
        {b.status === 'quoted' && (
          <Badge
            variant="filled"
            radius="sm"
            style={{ background: '#FFB74D', color: '#0F3D2E', alignSelf: 'flex-start' }}
          >
            已報價 {fmtMoney(b.quotedPrice)} · 等待客人確認
          </Badge>
        )}
      </Stack>
    </Card>
  );
}
