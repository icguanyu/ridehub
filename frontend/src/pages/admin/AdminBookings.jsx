import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Title, SegmentedControl, Table, Group, Pagination, Text, Anchor } from '@mantine/core';
import { useAdminBookings } from '@/hooks/useAdmin';
import Spinner from '@/components/Spinner';
import { fmtMoney, STATUS_LABEL } from '@/lib/format';

const FILTERS = [
  { label: '全部', value: '' },
  { label: '待確認', value: 'pending' },
  { label: '報價中', value: 'quoted' },
  { label: '已接受', value: 'accepted' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminBookings({ status, page });

  const total = data?.pagination?.total ?? 0;
  const pageSize = data?.pagination?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Stack gap="md">
      <Title order={4}>全站預約（{total}）</Title>

      <SegmentedControl
        data={FILTERS}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table striped highlightOnHover style={{ opacity: isFetching ? 0.6 : 1 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>日期</Table.Th>
                <Table.Th>司機</Table.Th>
                <Table.Th>客人</Table.Th>
                <Table.Th>路線</Table.Th>
                <Table.Th>狀態</Table.Th>
                <Table.Th ta="right">車資</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.bookings ?? []).map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td className="mono">
                    {b.bookingDate} {b.bookingTime}
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/admin/drivers/${b.driverId}`}>
                      {b.driverName ?? '—'}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    {b.customerName}
                    <Text span size="xs" c="dimmed">
                      {' '}
                      {b.customerPhone}
                    </Text>
                  </Table.Td>
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
      )}

      {!isLoading && !data?.bookings?.length && (
        <Text c="dimmed" size="sm">
          查無預約。
        </Text>
      )}

      {totalPages > 1 && (
        <Group justify="center">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      )}
    </Stack>
  );
}
