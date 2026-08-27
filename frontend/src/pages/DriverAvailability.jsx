import { useEffect } from 'react';
import { Card, Stack, Title, Group, NumberInput, Button, Text } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
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
    initialValues: { operatingHoursStart: '', operatingHoursEnd: '', maxDailyBookings: 10 },
    validate: {
      operatingHoursEnd: (v, values) =>
        v && values.operatingHoursStart && v <= values.operatingHoursStart
          ? '結束時間需晚於開始時間'
          : null,
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        operatingHoursStart: data.operatingHoursStart ?? '',
        operatingHoursEnd: data.operatingHoursEnd ?? '',
        maxDailyBookings: data.maxDailyBookings ?? 10,
      });
      form.resetDirty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <Spinner />;

  const submit = form.onSubmit((v) => {
    const patch = { maxDailyBookings: Number(v.maxDailyBookings) };
    if (v.operatingHoursStart) patch.operatingHoursStart = v.operatingHoursStart;
    if (v.operatingHoursEnd) patch.operatingHoursEnd = v.operatingHoursEnd;
    update.mutate(patch, {
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
          <Group grow>
            <TimeInput label="營運開始" {...form.getInputProps('operatingHoursStart')} />
            <TimeInput label="營運結束" {...form.getInputProps('operatingHoursEnd')} />
          </Group>
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
