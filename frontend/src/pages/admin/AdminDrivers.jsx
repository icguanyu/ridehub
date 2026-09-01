import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Title, TextInput, Table, Badge, Group, Pagination, Text, Anchor } from '@mantine/core';
import { useAdminDrivers } from '@/hooks/useAdmin';
import Spinner from '@/components/Spinner';

export default function AdminDrivers() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useAdminDrivers({ search, page });
  const total = data?.pagination?.total ?? 0;
  const pageSize = data?.pagination?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const doSearch = (e) => {
    e.preventDefault();
    setSearch(input.trim());
    setPage(1);
  };

  return (
    <Stack gap="md">
      <Title order={4}>司機（{total}）</Title>

      <form onSubmit={doSearch}>
        <Group gap="xs" maw={420}>
          <TextInput
            flex={1}
            placeholder="搜尋姓名 / 電話 / email"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
          />
        </Group>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <Table.ScrollContainer minWidth={640}>
          <Table striped highlightOnHover style={{ opacity: isFetching ? 0.6 : 1 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>姓名</Table.Th>
                <Table.Th>電話</Table.Th>
                <Table.Th>狀態</Table.Th>
                <Table.Th ta="right">預約數</Table.Th>
                <Table.Th>最後預約</Table.Th>
                <Table.Th>註冊</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.drivers ?? []).map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/admin/drivers/${d.id}`}>
                      {d.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td className="mono">{d.phone}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {d.suspendedAt && (
                        <Badge color="red" variant="light" size="sm">
                          停權
                        </Badge>
                      )}
                      {d.isVerified && (
                        <Badge color="teal" variant="light" size="sm">
                          已驗證
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right">{d.bookingsCount}</Table.Td>
                  <Table.Td>{d.lastBookingDate ?? '—'}</Table.Td>
                  <Table.Td>{d.createdAt?.slice(0, 10)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {!isLoading && !data?.drivers?.length && (
        <Text c="dimmed" size="sm">
          查無司機。
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
