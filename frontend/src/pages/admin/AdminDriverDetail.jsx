import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Button, Group, Text, Box, SimpleGrid, Badge, Divider, Table } from '@mantine/core';
import { useAdminDriver, useAdminSetVerified, useAdminSetSuspended } from '@/hooks/useAdmin';
import Spinner from '@/components/Spinner';
import { fmtMoney, STATUS_LABEL } from '@/lib/format';
import { notifyOk, notifyErr } from '@/lib/notify';

function Field({ label, children }) {
  return (
    <div>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{children ?? '—'}</Text>
    </div>
  );
}

export default function AdminDriverDetail() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminDriver(driverId);
  const setVerified = useAdminSetVerified();
  const setSuspended = useAdminSetSuspended();
  const busy = setVerified.isPending || setSuspended.isPending;

  if (isLoading) return <Spinner />;
  if (!data?.driver) return <Text c="dimmed">找不到司機。</Text>;

  const d = data.driver;
  const s = data.stats ?? {};

  const doVerify = (verified) =>
    setVerified.mutate(
      { driverId, verified },
      { onSuccess: () => notifyOk(verified ? '已標記驗證' : '已取消驗證'), onError: (e) => notifyErr(e) },
    );

  const doSuspend = (suspended) => {
    let reason;
    if (suspended) {
      reason = window.prompt('停權理由（選填）') ?? undefined;
      if (!window.confirm('確定停權？該司機將無法登入、無法被預約。')) return;
    }
    setSuspended.mutate(
      { driverId, suspended, reason },
      { onSuccess: () => notifyOk(suspended ? '已停權' : '已解除停權'), onError: (e) => notifyErr(e) },
    );
  };

  return (
    <Stack gap="md">
      <Group>
        <Button variant="subtle" size="xs" onClick={() => navigate('/admin/drivers')}>
          ← 司機列表
        </Button>
      </Group>

      <Group justify="space-between" wrap="nowrap">
        <Group gap={8}>
          <Title order={4}>{d.name}</Title>
          {d.suspendedAt && (
            <Badge color="red" variant="light">
              停權中
            </Badge>
          )}
          {d.isVerified && (
            <Badge color="teal" variant="light">
              已驗證
            </Badge>
          )}
        </Group>
      </Group>

      <Group gap="xs">
        {d.isVerified ? (
          <Button size="xs" variant="default" loading={busy} onClick={() => doVerify(false)}>
            取消驗證
          </Button>
        ) : (
          <Button size="xs" color="teal" loading={busy} onClick={() => doVerify(true)}>
            標記已驗證
          </Button>
        )}
        {d.suspendedAt ? (
          <Button size="xs" variant="default" loading={busy} onClick={() => doSuspend(false)}>
            解除停權
          </Button>
        ) : (
          <Button size="xs" color="red" variant="light" loading={busy} onClick={() => doSuspend(true)}>
            停權
          </Button>
        )}
      </Group>

      <Box style={{ border: '1px solid #E4E0D0', borderRadius: 12, padding: 16, background: '#fff' }}>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          <Field label="電話">{d.phone}</Field>
          <Field label="Email">{d.email}</Field>
          <Field label="車型">{[d.carType, d.carPlate].filter(Boolean).join('・')}</Field>
          <Field label="服務區域">{d.serviceAreas}</Field>
          <Field label="定價">
            {d.basePrice != null ? `起 ${fmtMoney(d.basePrice)}` : '—'}
            {d.pricePerKm ? `／km +${fmtMoney(d.pricePerKm)}` : ''}
          </Field>
          <Field label="可載客上限">{d.maxPassengers}</Field>
          <Field label="乘客責任險">{d.passengerInsuranceWan ? `${d.passengerInsuranceWan} 萬` : '—'}</Field>
          <Field label="LINE 綁定">{d.lineId ? '已綁' : '未綁'}</Field>
          <Field label="註冊">{d.createdAt?.slice(0, 10)}</Field>
        </SimpleGrid>
      </Box>

      <Divider label="本月統計" />
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Field label="營收">{fmtMoney(s.totalRevenue)}</Field>
        <Field label="成交趟數">{s.acceptedBookings ?? 0}</Field>
        <Field label="乘客數">{s.totalCustomers ?? 0}</Field>
        <Field label="總預約">{s.totalBookings ?? 0}</Field>
      </SimpleGrid>

      <Divider label="近 20 筆預約" />
      <Table.ScrollContainer minWidth={560}>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>日期</Table.Th>
              <Table.Th>客人</Table.Th>
              <Table.Th>路線</Table.Th>
              <Table.Th>狀態</Table.Th>
              <Table.Th ta="right">車資</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data.recentBookings ?? []).map((b) => (
              <Table.Tr key={b.id}>
                <Table.Td className="mono">
                  {b.bookingDate} {b.bookingTime}
                </Table.Td>
                <Table.Td>{b.customerName}</Table.Td>
                <Table.Td>
                  {b.pickupLocation} → {b.destination}
                </Table.Td>
                <Table.Td>{STATUS_LABEL[b.status] ?? b.status}</Table.Td>
                <Table.Td ta="right" className="mono">
                  {fmtMoney(b.agreedPrice)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
