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
  SegmentedControl,
  Input,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { usePublicDriver, useCreateBooking } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import Wordmark from '@/components/Wordmark';
import { fmtMoney } from '@/lib/format';
import { notifyErr } from '@/lib/notify';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function NativeDateInput({ label, withAsterisk, min, value, onChange, error }) {
  return (
    <Input.Wrapper label={label} withAsterisk={withAsterisk} error={error}>
      <Input
        component="input"
        type="date"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        styles={{ input: { cursor: 'pointer', colorScheme: 'light' } }}
      />
    </Input.Wrapper>
  );
}

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
      tripType: 'one_way',
      pickupLocation: '',
      destination: '',
      bookingDate: '',
      bookingTime: '',
      returnDate: '',
      returnTime: '',
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
      returnDate: (v, values) =>
        values.tripType !== 'round_trip'
          ? null
          : !v
            ? '請選擇回程日期'
            : values.bookingDate && v < values.bookingDate
              ? '回程不可早於去程'
              : null,
      returnTime: (v, values) =>
        values.tripType !== 'round_trip' ? null : v ? null : '請選擇回程時間',
    },
  });

  const isRoundTrip = form.values.tripType === 'round_trip';

  const priceBreakdown = useMemo(() => {
    if (!driver) return null;
    const base = Number(driver.basePrice ?? 0);
    const perKm = Number(driver.pricePerKm ?? 0);
    const km = Number(form.values.estimatedDistanceKm || 0);
    const oneWay = Math.round(base + perKm * km);
    const mult = isRoundTrip ? 2 : 1;
    return { oneWay, mult, total: oneWay * mult };
  }, [driver, form.values.estimatedDistanceKm, isRoundTrip]);

  if (isLoading)
    return (
      <Center mih="100vh">
        <Spinner />
      </Center>
    );
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
      tripType: v.tripType,
      pickupLocation: v.pickupLocation.trim(),
      destination: v.destination.trim(),
      bookingDate: v.bookingDate,
      bookingTime: v.bookingTime,
      passengerCount: Number(v.passengerCount) || 1,
    };
    if (v.tripType === 'round_trip') {
      payload.returnDate = v.returnDate;
      payload.returnTime = v.returnTime;
    }
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
        <Center mb="lg">
          <Wordmark size={28} withMark markSize={34} />
        </Center>
        <Card radius="xl" p="lg">
          <form onSubmit={submit}>
            <Stack>
              <div>
                <Title order={3}>預約 {driver.name}</Title>
                <Text size="xs" c="dimmed">
                  請確認是您要預約的司機
                </Text>
              </div>

              <SegmentedControl
                fullWidth
                data={[
                  { label: '單程', value: 'one_way' },
                  { label: '往返', value: 'round_trip' },
                ]}
                {...form.getInputProps('tripType')}
              />

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
                <NativeDateInput
                  label="去程日期"
                  withAsterisk
                  min={todayISO()}
                  value={form.values.bookingDate}
                  onChange={(v) => form.setFieldValue('bookingDate', v)}
                  error={form.errors.bookingDate}
                />
                <TimeInput label="去程時間" withAsterisk {...form.getInputProps('bookingTime')} />
              </Group>

              {isRoundTrip && (
                <Group grow>
                  <NativeDateInput
                    label="回程日期"
                    withAsterisk
                    min={form.values.bookingDate || todayISO()}
                    value={form.values.returnDate}
                    onChange={(v) => form.setFieldValue('returnDate', v)}
                    error={form.errors.returnDate}
                  />
                  <TimeInput label="回程時間" withAsterisk {...form.getInputProps('returnTime')} />
                </Group>
              )}

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
                <Card p="sm" radius="md" style={{ background: '#F3F1E4' }}>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      單程預估
                    </Text>
                    <Text size="sm" className="mono">
                      {fmtMoney(priceBreakdown.oneWay)}
                    </Text>
                  </Group>
                  {isRoundTrip && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        往返 × 2
                      </Text>
                      <Text size="sm" className="mono">
                        {fmtMoney(priceBreakdown.total)}
                      </Text>
                    </Group>
                  )}
                  <Divider my={6} />
                  <Group justify="space-between">
                    <Text fw={700}>預估合計</Text>
                    <Text fw={700} className="mono" style={{ color: '#0F3D2E' }}>
                      {fmtMoney(priceBreakdown.total)}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    實際金額以司機確認為準，司機可能重新報價
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
