import { useParams, useSearchParams } from 'react-router-dom';
import {
  Center,
  Box,
  Card,
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Divider,
  Alert,
  CopyButton,
} from '@mantine/core';
import { useBookingStatus } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import { fmtMoney, fmtDateTime, STATUS_LABEL, STATUS_COLOR } from '@/lib/format';

const STATUS_HINT = {
  pending: '預約已送出，等待司機確認（司機通常會在 24 小時內回覆）。',
  accepted: '司機已接受！以下是聯絡方式，出發前可先聯繫。',
  rejected: '很抱歉，司機無法接受這次預約。',
  completed: '行程已完成，感謝搭乘。',
  cancelled: '這筆預約已取消。',
};

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const { data: b, isLoading, isError, refetch, isFetching } = useBookingStatus(bookingId, token);

  const shareUrl = window.location.href;

  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={440}>
        <Text ta="center" fw={700} size="xl" c="blue.6" mb="lg">
          RideHub
        </Text>

        {!token ? (
          <Card withBorder p="lg">
            <Text c="dimmed">連結缺少查詢憑證，無法顯示預約狀態。</Text>
          </Card>
        ) : isLoading ? (
          <Spinner />
        ) : isError ? (
          <Card withBorder p="lg">
            <Text c="dimmed">查不到這筆預約，連結可能有誤或已失效。</Text>
          </Card>
        ) : (
          <Stack>
            <Card withBorder shadow="sm" radius="md" p="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={3}>預約狀態</Title>
                  <Badge size="lg" color={STATUS_COLOR[b.status]} variant="light">
                    {STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                </Group>

                <Alert color={STATUS_COLOR[b.status]} variant="light">
                  {STATUS_HINT[b.status]}
                </Alert>

                <Divider />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    行程
                  </Text>
                  <Text size="sm">
                    {b.pickupLocation} → {b.destination}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    時間
                  </Text>
                  <Text size="sm">{fmtDateTime(b.bookingDate, b.bookingTime)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    人數
                  </Text>
                  <Text size="sm">{b.passengerCount} 人</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    預估車資
                  </Text>
                  <Text size="sm">{fmtMoney(b.estimatedPrice)}</Text>
                </Group>

                {b.status === 'rejected' && b.rejectedReason && (
                  <Text size="sm" c="red">
                    原因：{b.rejectedReason}
                  </Text>
                )}
              </Stack>
            </Card>

            {b.status === 'accepted' && (
              <Card withBorder radius="md" p="lg">
                <Stack gap={6}>
                  <Title order={4}>司機聯絡方式</Title>
                  <Text size="sm">姓名：{b.driverName}</Text>
                  <Text size="sm">電話：{b.driverPhone}</Text>
                  {b.driverLineId && <Text size="sm">LINE：{b.driverLineId}</Text>}
                </Stack>
              </Card>
            )}

            <Group>
              <Button variant="light" loading={isFetching} onClick={() => refetch()}>
                重新整理
              </Button>
              <CopyButton value={shareUrl}>
                {({ copied, copy }) => (
                  <Button variant="default" onClick={copy}>
                    {copied ? '已複製連結' : '複製狀態連結'}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed" ta="center">
              保存此頁連結即可隨時查看最新狀態。
            </Text>
          </Stack>
        )}
      </Box>
    </Center>
  );
}
