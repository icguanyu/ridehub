import { Card, Group, Text, Badge, Stack, Button, Anchor } from '@mantine/core';
import { fmtMoney, STATUS_LABEL, STATUS_COLOR } from '@/lib/format';
import { isTripStarted } from '@/lib/trip';
import TripRoute, { TripTypeBadge } from '@/components/TripRoute';

export default function BookingCard({
  booking,
  onAccept,
  onReject,
  onQuote,
  onComplete,
  onDelete,
  onOpen,
  busy,
  actionable,
}) {
  const b = booking;
  const canDelete = Boolean(onDelete) && !isTripStarted(b);
  const canComplete = Boolean(onComplete) && actionable && b.status === 'accepted';

  return (
    <Card radius="lg" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap={8}>
            <Text fw={700}>{b.customerName}</Text>
            <TripTypeBadge tripType={b.tripType} />
          </Group>
          <Group gap={8} wrap="nowrap">
            <Badge color={STATUS_COLOR[b.status]} variant="light">
              {STATUS_LABEL[b.status] ?? b.status}
            </Badge>
            {onOpen && (
              <Anchor component="button" type="button" size="xs" onClick={() => onOpen(b)}>
                詳情 ›
              </Anchor>
            )}
          </Group>
        </Group>

        <TripRoute booking={b} />

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

        {(b.estimatedDistanceKm != null || b.estimatedEnergyCost != null) && (
          <Text size="xs" c="dimmed">
            {b.estimatedDistanceKm != null && `距離約 ${b.estimatedDistanceKm} km`}
            {b.estimatedDurationMin != null && `・車程約 ${b.estimatedDurationMin} 分`}
            {b.estimatedEnergyCost != null && (
              <>
                {b.estimatedDistanceKm != null && '・'}
                能耗成本 ≈ <span className="mono">{fmtMoney(b.estimatedEnergyCost)}</span>
              </>
            )}
            （僅供參考）
          </Text>
        )}

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

        {canComplete && (
          <Button
            size="xs"
            variant="light"
            color="leaf"
            loading={busy}
            onClick={() => onComplete?.(b)}
            style={{ alignSelf: 'flex-start' }}
          >
            標記完成
          </Button>
        )}

        {canDelete && (
          <Button
            size="xs"
            variant="subtle"
            color="red"
            loading={busy}
            onClick={() => onDelete?.(b)}
            style={{ alignSelf: 'flex-end' }}
          >
            刪除行程
          </Button>
        )}
      </Stack>
    </Card>
  );
}
