import { Group, Text, Button, Loader } from '@mantine/core';
import { useVerifications, useSubmitPhotoVerification } from '@/hooks/useDriver';
import { notifyOk, notifyErr } from '@/lib/notify';

// DriverEdit 大頭貼下方的一行送審狀態。
export default function AvatarVerifyStatus({ driverId, hasAvatar }) {
  const { data, isLoading } = useVerifications(driverId);
  const submit = useSubmitPhotoVerification(driverId);

  if (isLoading) return <Loader size="xs" />;

  const photo = (data?.items ?? []).find((i) => i.kind === 'photo');
  const status = photo?.status ?? 'none';

  const doSubmit = () =>
    submit.mutate(undefined, {
      onSuccess: () => notifyOk('已送出審核'),
      onError: (e) => notifyErr(e),
    });

  if (status === 'approved') {
    return (
      <Text size="xs" c="teal">
        ✓ 大頭照已通過平台審核
      </Text>
    );
  }

  if (status === 'pending') {
    return (
      <Text size="xs" c="orange">
        ● 大頭照審核中，通常 1–2 個工作天
      </Text>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="xs" c={status === 'rejected' ? 'red' : 'dimmed'}>
        {status === 'rejected'
          ? `未通過：${photo.note || '請更換照片後重新送審'}`
          : '大頭照尚未送審'}
      </Text>
      <Button
        size="compact-xs"
        variant="light"
        disabled={!hasAvatar}
        loading={submit.isPending}
        onClick={doSubmit}
      >
        {status === 'rejected' ? '重新送審' : '送出審核'}
      </Button>
    </Group>
  );
}
