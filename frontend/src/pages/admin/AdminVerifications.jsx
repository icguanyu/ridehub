import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Image,
  Button,
  TextInput,
  Anchor,
  Badge,
} from '@mantine/core';
import { useAdminVerifications, useReviewVerification } from '@/hooks/useAdmin';
import Spinner from '@/components/Spinner';
import { notifyOk, notifyErr } from '@/lib/notify';

const KIND_LABEL = {
  photo: '真人大頭照',
  vehicle_license: '行照 / 車牌',
  driver_license: '駕照',
  selfie_id: '手持證件自拍',
  identity: '姓名 / 生日',
};

function ReviewRow({ item, onReview, pending }) {
  const [note, setNote] = useState('');

  const submit = (action) => {
    if (action === 'reject' && !note.trim()) {
      notifyErr('駁回請填寫原因（司機看得到）');
      return;
    }
    onReview({ id: item.id, action, note: note.trim() });
  };

  return (
    <Card withBorder radius="md" p="md">
      <Group align="flex-start" wrap="nowrap" gap="md">
        {item.fileUrl ? (
          <Image
            src={item.fileUrl}
            w={96}
            h={96}
            radius="md"
            fit="cover"
            alt="待審圖片"
          />
        ) : (
          <Text size="xs" c="dimmed" w={96}>
            無圖片
          </Text>
        )}

        <Stack gap={6} style={{ flex: 1 }}>
          <Group gap="xs">
            <Badge variant="light">{KIND_LABEL[item.kind] ?? item.kind}</Badge>
            <Text size="xs" c="dimmed">
              {new Date(item.createdAt).toLocaleString('zh-TW')}
            </Text>
          </Group>

          <Text size="sm">
            <Anchor component={Link} to={`/admin/drivers/${item.driverId}`}>
              {item.driverName ?? '—'}
            </Anchor>
            <Text span size="xs" c="dimmed">
              {' '}
              {item.driverPhone}
            </Text>
          </Text>

          <TextInput
            size="xs"
            placeholder="備註 / 駁回原因（駁回必填，司機看得到）"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />

          <Group gap="xs" mt={4}>
            <Button size="xs" color="teal" loading={pending} onClick={() => submit('approve')}>
              核准
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={pending}
              onClick={() => submit('reject')}
            >
              駁回
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default function AdminVerifications() {
  const { data, isLoading } = useAdminVerifications();
  const review = useReviewVerification();

  const items = data?.items ?? [];

  const onReview = (payload) =>
    review.mutate(payload, {
      onSuccess: (r) => notifyOk(r.status === 'approved' ? '已核准' : '已駁回'),
      onError: (e) => notifyErr(e),
    });

  return (
    <Stack gap="md">
      <Title order={4}>驗證審核（{items.length}）</Title>

      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Text c="dimmed" size="sm">
          目前沒有待審項目。
        </Text>
      ) : (
        items.map((item) => (
          <ReviewRow key={item.id} item={item} onReview={onReview} pending={review.isPending} />
        ))
      )}
    </Stack>
  );
}
