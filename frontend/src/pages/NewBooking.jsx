import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Card,
  Divider,
  SegmentedControl,
  Input,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useDriver, useDistancePreview } from '@/hooks/useDriver';
import { useCreateDriverBooking } from '@/hooks/useBookings';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';
import { estimateEnergyCost } from '@/lib/energy';
import { todayISO } from '@/lib/tz';
import { notifyOk, notifyErr } from '@/lib/notify';

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

export default function NewBooking() {
  const navigate = useNavigate();
  const driverId = useCurrentDriverId();
  const driver = useDriver(driverId);
  const fuel = useFuelPrices();
  const distance = useDistancePreview(driverId);
  const create = useCreateDriverBooking(driverId);
  const [durationHint, setDurationHint] = useState(undefined);

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
      agreedPrice: '',
      specialRequests: '',
    },
    validate: {
      customerName: (v) => (v.trim() ? null : '請輸入客人姓名'),
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

  const estimate = useMemo(() => {
    const d = driver.data;
    if (!d) return null;
    const base = Number(d.basePrice ?? 0);
    const perKm = Number(d.pricePerKm ?? 0);
    const km = Number(form.values.estimatedDistanceKm || 0);
    const oneWay = Math.round(base + perKm * km);
    return oneWay * (isRoundTrip ? 2 : 1);
  }, [driver.data, form.values.estimatedDistanceKm, isRoundTrip]);

  const energyCost = useMemo(() => {
    const d = driver.data;
    if (!d?.energyType) return null;
    const unitPrice =
      d.energyUnitPrice ?? (d.energyType !== 'ev' ? fuel.data?.prices?.[d.energyType] : null);
    return estimateEnergyCost({
      energyType: d.energyType,
      consumption: d.energyConsumption,
      unitPrice,
      distanceKm: form.values.estimatedDistanceKm,
      tripType: form.values.tripType,
    });
  }, [driver.data, fuel.data, form.values.estimatedDistanceKm, form.values.tripType]);

  if (driver.isLoading) return <Spinner />;

  const autoDistance = () => {
    distance.mutate(
      { origin: form.values.pickupLocation.trim(), destination: form.values.destination.trim() },
      {
        onSuccess: (r) => {
          if (r.distanceKm == null) {
            setDurationHint(undefined);
            notifyErr(new Error('查不到這兩點的距離，請手動填'), '自動估算失敗');
            return;
          }
          form.setFieldValue('estimatedDistanceKm', r.distanceKm);
          setDurationHint(r.durationMin ? `車程約 ${r.durationMin} 分鐘` : undefined);
        },
        onError: (e) => notifyErr(e, '自動估算失敗'),
      },
    );
  };

  const submit = form.onSubmit((v) => {
    const payload = {
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
    if (v.agreedPrice !== '') payload.agreedPrice = Number(v.agreedPrice);

    create.mutate(payload, {
      onSuccess: (r) => {
        notifyOk('訂單已建立（已接受）');
        navigate(`/dashboard/bookings/${r.booking.id}`);
      },
      onError: (e) => notifyErr(e, '建立失敗'),
    });
  });

  return (
    <Stack gap="md">
      <Group>
        <Button variant="subtle" size="xs" onClick={() => navigate('/dashboard/bookings')}>
          ← 回列表
        </Button>
      </Group>
      <Title order={4}>新增訂單</Title>
      <Text size="xs" c="dimmed">
        客人已談好、不想自己上平台輸入時由你代填。建立後直接進「已接受」。
      </Text>

      <Card radius="lg" p="md">
        <form onSubmit={submit}>
          <Stack>
            <SegmentedControl
              fullWidth
              data={[
                { label: '單程', value: 'one_way' },
                { label: '往返', value: 'round_trip' },
              ]}
              {...form.getInputProps('tripType')}
            />

            <Group grow>
              <TextInput label="客人姓名" withAsterisk {...form.getInputProps('customerName')} />
              <TextInput
                label="客人電話"
                withAsterisk
                placeholder="0912345678"
                inputMode="numeric"
                {...form.getInputProps('customerPhone')}
              />
            </Group>
            <TextInput label="客人 LINE ID（選填）" {...form.getInputProps('customerLineId')} />
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
                label={`人數（最多 ${driver.data?.maxPassengers ?? 20} 人）`}
                min={1}
                max={driver.data?.maxPassengers ?? 20}
                clampBehavior="strict"
                {...form.getInputProps('passengerCount')}
              />
              <NumberInput
                label="預估距離 (km，選填)"
                description={durationHint}
                min={0}
                {...form.getInputProps('estimatedDistanceKm')}
              />
            </Group>
            <Button
              variant="light"
              size="xs"
              loading={distance.isPending}
              disabled={!form.values.pickupLocation.trim() || !form.values.destination.trim()}
              onClick={autoDistance}
            >
              依上車／目的地自動估算距離
            </Button>

            <NumberInput
              label="議定車資（選填，留空則用估價）"
              min={0}
              thousandSeparator=","
              prefix="NT$ "
              {...form.getInputProps('agreedPrice')}
            />

            <Textarea
              label="特殊需求（選填）"
              autosize
              minRows={2}
              {...form.getInputProps('specialRequests')}
            />

            {estimate != null && (
              <Card p="sm" radius="md" style={{ background: '#F3F1E4' }}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    自動估價{isRoundTrip ? '（往返 ×2）' : ''}
                  </Text>
                  <Text size="sm" className="mono">
                    {fmtMoney(estimate)}
                  </Text>
                </Group>
                <Divider my={6} />
                <Group justify="space-between">
                  <Text fw={700}>實際入帳</Text>
                  <Text fw={700} className="mono" style={{ color: '#0F3D2E' }}>
                    {fmtMoney(form.values.agreedPrice !== '' ? Number(form.values.agreedPrice) : estimate)}
                  </Text>
                </Group>
                {energyCost != null && (
                  <Group justify="space-between" mt={4}>
                    <Text size="xs" c="dimmed">
                      預估能耗成本（僅供參考）
                    </Text>
                    <Text size="xs" c="dimmed" className="mono">
                      ≈ {fmtMoney(energyCost)}
                    </Text>
                  </Group>
                )}
              </Card>
            )}

            <Button type="submit" size="md" loading={create.isPending} fullWidth>
              建立訂單
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
