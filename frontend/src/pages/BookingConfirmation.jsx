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
import { useBookingStatus, useRespondToQuote } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import Wordmark from '@/components/Wordmark';
import TripRoute, { TripTypeBadge } from '@/components/TripRoute';
import { fmtMoney, STATUS_LABEL, STATUS_COLOR } from '@/lib/format';
import { lineAddFriendUrl } from '@/lib/line';
import { notifyOk, notifyErr } from '@/lib/notify';

const STATUS_HINT = {
  pending: '預約已送出，等待司機確認（司機通常會在 24 小時內回覆）。',
  quoted: '司機提出了新的報價，請於下方確認是否接受。',
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
  const respond = useRespondToQuote(bookingId, token);

  const shareUrl = window.location.href;

  const doRespond = (accept) =>
    respond.mutate(accept, {
      onSuccess: () => notifyOk(accept ? '已同意報價，預約成立' : '已取消預約'),
      onError: (e) => notifyErr(e),
    });

  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={440}>
        <Center mb="lg">
          <Wordmark size={28} withMark markSize={34} />
        </Center>

        {!token ? (
          <Card p="lg">
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
            <Card radius="xl" p="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={3}>預約狀態</Title>
                  <Group gap={6}>
                    <TripTypeBadge tripType={b.tripType} />
                    <Badge size="lg" color={STATUS_COLOR[b.status]} variant="light">
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </Group>
                </Group>

                <Alert color={STATUS_COLOR[b.status]} variant="light">
                  {STATUS_HINT[b.status]}
                </Alert>

                <Divider />

                <TripRoute booking={b} />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    人數
                  </Text>
                  <Text size="sm">{b.passengerCount} 人</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {b.quotedPrice != null ? '司機報價' : '預估車資'}
                  </Text>
                  <Text size="sm" className="mono" fw={b.quotedPrice != null ? 700 : 400}>
                    {fmtMoney(b.quotedPrice ?? b.estimatedPrice)}
                  </Text>
                </Group>
                {b.quotedPrice != null && (
                  <Text size="xs" c="dimmed">
                    （原預估 <span className="mono">{fmtMoney(b.estimatedPrice)}</span>）
                  </Text>
                )}

                {b.status === 'rejected' && b.rejectedReason && (
                  <Text size="sm" c="danger.6">
                    原因：{b.rejectedReason}
                  </Text>
                )}
              </Stack>
            </Card>

            {b.status === 'quoted' && (
              <Card radius="lg" p="lg" style={{ borderColor: '#FFB74D', borderWidth: 2 }}>
                <Stack gap="sm">
                  <Title order={4}>司機報價</Title>
                  <Text className="mono" fw={700} style={{ fontSize: 28, color: '#0F3D2E' }}>
                    {fmtMoney(b.quotedPrice)}
                  </Text>
                  {b.quoteNote && (
                    <Text size="sm" c="dimmed">
                      司機說明：{b.quoteNote}
                    </Text>
                  )}
                  <Group grow mt="xs">
                    <Button color="brand" loading={respond.isPending} onClick={() => doRespond(true)}>
                      同意報價
                    </Button>
                    <Button
                      variant="default"
                      loading={respond.isPending}
                      onClick={() => doRespond(false)}
                    >
                      不同意
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )}

            {b.status === 'accepted' && (
              <Card radius="lg" p="lg" style={{ background: '#0F3D2E' }}>
                <Stack gap={6}>
                  <Title order={4} c="#FAF7EB">
                    司機聯絡方式
                  </Title>
                  <Text size="sm" c="#DCE9DC">
                    姓名：{b.driverName}
                  </Text>
                  <Text size="sm" c="#DCE9DC" className="mono">
                    電話：{b.driverPhone}
                  </Text>
                  {b.driverLineDisplayId && (
                    <Group gap={8} align="center">
                      <Text size="sm" c="#DCE9DC">
                        LINE：{b.driverLineDisplayId}
                      </Text>
                      <Button
                        component="a"
                        href={lineAddFriendUrl(b.driverLineDisplayId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                        variant="white"
                        color="dark"
                        px={10}
                      >
                        加好友
                      </Button>
                    </Group>
                  )}
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
