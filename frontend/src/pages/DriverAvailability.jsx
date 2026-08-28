import { useEffect } from 'react';
import { Card, Stack, Title, NumberInput, Button, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useAvailability, useUpdateAvailability } from '@/hooks/useDriver';
import Spinner from '@/components/Spinner';
import { notifyOk, notifyErr } from '@/lib/notify';

export default function DriverAvailability() {
  const driverId = useCurrentDriverId();
  const { data, isLoading } = useAvailability(driverId);
  const update = useUpdateAvailability(driverId);

  const form = useForm({
    initialValues: { maxDailyBookings: 10 },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        maxDailyBookings: data.maxDailyBookings ?? 10,
      });
      form.resetDirty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <Spinner />;

  const submit = form.onSubmit((v) => {
    update.mutate({ maxDailyBookings: Number(v.maxDailyBookings) }, {
      onSuccess: () => notifyOk('時間設定已更新'),
      onError: (e) => notifyErr(e),
    });
  });

  return (
    <Card withBorder radius="md" p="lg">
      <form onSubmit={submit}>
        <Stack>
          <Title order={4}>時間設定</Title>
          <Text size="sm" c="dimmed">
            今日已接受預約：{data?.bookedTodayCount ?? 0} / {data?.maxDailyBookings ?? '—'}
          </Text>
          <NumberInput
            label="每日最多接單數"
            min={1}
            max={100}
            {...form.getInputProps('maxDailyBookings')}
          />
          <Button type="submit" loading={update.isPending}>
            儲存
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
