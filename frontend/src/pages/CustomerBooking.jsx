import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Center,
  Box,
  Card,
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Divider,
  Anchor,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { usePublicDriver, useCreateBooking } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { notifyErr } from '@/lib/notify';

export default function CustomerBooking() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { data: driver, isLoading, isError } = usePublicDriver(driverId);
  const createBooking = useCreateBooking();

  const form = useForm({
    initialValues: {
      customerName: '',
      customerPhone: '',
      customerLineId: '',
      pickupLocation: '',
      destination: '',
      bookingDate: null,
      bookingTime: '',
      passengerCount: 1,
      estimatedDistanceKm: '',
      specialRequests: '',
    },
    validate: {
      customerName: (v) => (v.trim() ? null : '請輸入姓名'),
      customerPhone: (v) => (/^09\d{8}$/.test(v) ? null : '手機格式需為 09xxxxxxxx'),
      pickupLocation: (v) => (v.trim() ? null : '請輸入上車地點'),
      destination: (v) => (v.trim() ? null : '請輸入目的地'),
      bookingDate: (v) => (v ? null : '請選擇日期'),
      bookingTime: (v) => (v ? null : '請選擇時間'),
    },
  });

  const priceBreakdown = useMemo(() => {
    if (!driver) return null;
    const base = Number(driver.basePrice ?? 0);
    const perKm = Number(driver.pricePerKm ?? 0);
    const km = Number(form.values.estimatedDistanceKm || 0);
    const distanceFee = Math.round(perKm * km);
    return { base: Math.round(base), distanceFee, total: Math.round(base) + distanceFee };
  }, [driver, form.values.estimatedDistanceKm]);

  if (isLoading) return <Center mih="100vh"><Spinner /></Center>;
  if (isError)
    return (
      <Center mih="100vh" px="md">
        <Text c="dimmed">找不到這位司機，連結可能有誤。</Text>
      </Center>
    );

  const submit = form.onSubmit((v) => {
    const payload = {
      driverId,
      customerName: v.customerName.trim(),
      customerPhone: v.customerPhone,
      pickupLocation: v.pickupLocation.trim(),
      destination: v.destination.trim(),
      bookingDate: dayjs(v.bookingDate).format('YYYY-MM-DD'),
      bookingTime: v.bookingTime,
      passengerCount: Number(v.passengerCount) || 1,
    };
    if (v.customerLineId.trim()) payload.customerLineId = v.customerLineId.trim();
    if (v.specialRequests.trim()) payload.specialRequests = v.specialRequests.trim();
    if (v.estimatedDistanceKm !== '') payload.estimatedDistanceKm = Number(v.estimatedDistanceKm);

    createBooking.mutate(payload, {
      onSuccess: (b) => navigate(`/booking/${b.id}?token=${b.statusToken}`),
      onError: (e) => notifyErr(e, '預約失敗'),
    });
  });

  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={460}>
        <Text ta="center" fw={700} size="xl" c="blue.6" mb="lg">
          RideHub
        </Text>
        <Card withBorder shadow="sm" radius="md" p="lg">
          <form onSubmit={submit}>
            <Stack>
              <div>
                <Title order={3}>預約 {driver.name}</Title>
                <Text size="xs" c="dimmed">
                  請確認是您要預約的司機
                </Text>
              </div>

              <Group grow>
                <TextInput label="您的名字" withAsterisk {...form.getInputProps('customerName')} />
                <TextInput
                  label="您的電話"
                  withAsterisk
                  placeholder="0912345678"
                  inputMode="numeric"
                  {...form.getInputProps('customerPhone')}
                />
              </Group>
              <TextInput
                label="LINE ID（選填，用於接收通知）"
                {...form.getInputProps('customerLineId')}
              />
              <TextInput label="上車地點" withAsterisk {...form.getInputProps('pickupLocation')} />
              <TextInput label="目的地" withAsterisk {...form.getInputProps('destination')} />
              <Group grow>
                <DateInput
                  label="日期"
                  withAsterisk
                  valueFormat="YYYY-MM-DD"
                  minDate={new Date()}
                  {...form.getInputProps('bookingDate')}
                />
                <TimeInput label="時間" withAsterisk {...form.getInputProps('bookingTime')} />
              </Group>
              <Group grow>
                <NumberInput
                  label="人數"
                  withAsterisk
                  min={1}
                  max={20}
                  {...form.getInputProps('passengerCount')}
                />
                <NumberInput
                  label="預估距離 (km，選填)"
                  min={0}
                  {...form.getInputProps('estimatedDistanceKm')}
                />
              </Group>
              <Textarea
                label="特殊需求（選填）"
                autosize
                minRows={2}
                {...form.getInputProps('specialRequests')}
              />

              {priceBreakdown && (
                <Card bg="gray.0" p="sm" radius="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      基礎價格
                    </Text>
                    <Text size="sm">{fmtMoney(priceBreakdown.base)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      距離估算費
                    </Text>
                    <Text size="sm">{fmtMoney(priceBreakdown.distanceFee)}</Text>
                  </Group>
                  <Divider my={6} />
                  <Group justify="space-between">
                    <Text fw={600}>預估合計</Text>
                    <Text fw={700}>{fmtMoney(priceBreakdown.total)}</Text>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    實際金額以司機確認為準
                  </Text>
                </Card>
              )}

              <Button type="submit" size="md" loading={createBooking.isPending} fullWidth>
                確認預約
              </Button>
              <Anchor
                size="xs"
                ta="center"
                onClick={() => navigate(`/driver/${driverId}`)}
                component="button"
                type="button"
              >
                ← 回司機資訊
              </Anchor>
            </Stack>
          </form>
        </Card>
      </Box>
    </Center>
  );
}
