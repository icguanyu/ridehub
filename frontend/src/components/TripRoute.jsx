import { Badge, Group, Stack, Text } from '@mantine/core';
import { fmtDateTime } from '@/lib/format';

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

function RoundTripIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={11}
      height={11}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// 單程 = 灰色外框；往返 = 品牌色 + 往返箭頭
export function TripTypeBadge({ tripType, size = 'sm' }) {
  if (tripType === 'round_trip') {
    return (
      <Badge
        variant="filled"
        color="brand"
        size={size}
        leftSection={<RoundTripIcon />}
        styles={{ label: { display: 'flex', alignItems: 'center', gap: 4 } }}
      >
        往返
      </Badge>
    );
  }
  return (
    <Badge variant="outline" color="gray" size={size}>
      單程
    </Badge>
  );
}

// 行程路線區塊。
// timeMode='full'：顯示所有時間；'omitOutbound'：略過去程時間（呼叫端已另外顯示）
export default function TripRoute({ booking: b, timeMode = 'full' }) {
  const isRoundTrip = b?.tripType === 'round_trip';
  const showOutbound = timeMode !== 'omitOutbound';

  if (!isRoundTrip) {
    return (
      <Group gap={8} align="flex-start" wrap="nowrap">
        <PinIcon />
        <div>
          <Text size="sm" fw={500}>
            {b.pickupLocation} → {b.destination}
          </Text>
          {showOutbound && (
            <Text size="sm" c="dimmed" className="mono">
              {fmtDateTime(b.bookingDate, b.bookingTime)}
            </Text>
          )}
        </div>
      </Group>
    );
  }

  return (
    <Group gap={10} align="stretch" wrap="nowrap">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2E7D32', flex: 'none' }} />
        <span style={{ width: 2, flex: 1, background: '#CDE0CE', margin: '3px 0', minHeight: 18 }} />
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            border: '2px solid #2E7D32',
            background: '#fff',
            flex: 'none',
          }}
        />
      </div>
      <Stack gap={10} style={{ flex: 1 }}>
        <div>
          <Text size="sm" fw={500}>
            {b.pickupLocation} → {b.destination}
          </Text>
          <Text size="xs" c="dimmed" className={showOutbound ? 'mono' : undefined}>
            {showOutbound ? `去程 · ${fmtDateTime(b.bookingDate, b.bookingTime)}` : '去程'}
          </Text>
        </div>
        <div>
          <Text size="sm" fw={500}>
            {b.destination} → {b.pickupLocation}
          </Text>
          <Text size="xs" c="dimmed" className="mono">
            回程 · {b.returnDate ? fmtDateTime(b.returnDate, b.returnTime) : '待定'}
          </Text>
        </div>
      </Stack>
    </Group>
  );
}
