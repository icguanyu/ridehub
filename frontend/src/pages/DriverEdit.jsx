import { useEffect } from 'react';
import {
  Card,
  Stack,
  Title,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Select,
  Text,
  CopyButton,
  Center,
} from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { useForm } from '@mantine/form';
import { useCurrentDriverId } from '@/hooks/useAuth';
import { useDriver, useUpdateDriver } from '@/hooks/useDriver';
import LineBindingCard from '@/components/LineBindingCard';
import Spinner from '@/components/Spinner';
import { notifyOk, notifyErr } from '@/lib/notify';

const CAR_TYPES = ['轎車', '休旅車', '廂型車', '麵包車'];

export default function DriverEdit() {
  const driverId = useCurrentDriverId();
  const { data, isLoading } = useDriver(driverId);
  const update = useUpdateDriver(driverId);

  const form = useForm({
    initialValues: {
      name: '',
      serviceDescription: '',
      serviceAreas: '',
      carType: '',
      carPlate: '',
      basePrice: '',
      pricePerKm: '',
    },
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        name: data.name ?? '',
        serviceDescription: data.serviceDescription ?? '',
        serviceAreas: data.serviceAreas ?? '',
        carType: data.carType ?? '',
        carPlate: data.carPlate ?? '',
        basePrice: data.basePrice ?? '',
        pricePerKm: data.pricePerKm ?? '',
      });
      form.resetDirty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <Spinner />;

  const submit = form.onSubmit((v) => {
    const patch = {
      name: v.name.trim(),
      serviceDescription: v.serviceDescription || null,
      serviceAreas: v.serviceAreas || null,
      carType: v.carType || null,
      carPlate: v.carPlate || null,
      basePrice: v.basePrice === '' ? null : Number(v.basePrice),
      pricePerKm: v.pricePerKm === '' ? null : Number(v.pricePerKm),
    };
    update.mutate(patch, {
      onSuccess: () => notifyOk('服務資訊已更新'),
      onError: (e) => notifyErr(e),
    });
  });

  const shareUrl = `${window.location.origin}/driver/${driverId}`;

  return (
    <Stack gap="lg">
      <Card withBorder radius="md" p="lg">
        <form onSubmit={submit}>
          <Stack>
            <Title order={4}>服務資訊</Title>
            <TextInput label="姓名" {...form.getInputProps('name')} />
            <Textarea
              label="服務介紹"
              autosize
              minRows={2}
              placeholder="例如：新竹竹科專業接送，準時安全"
              {...form.getInputProps('serviceDescription')}
            />
            <TextInput
              label="服務區域"
              placeholder="逗號分隔，例如：新竹市,竹科園區"
              {...form.getInputProps('serviceAreas')}
            />
            <Group grow>
              <Select
                label="車型"
                data={CAR_TYPES}
                clearable
                {...form.getInputProps('carType')}
              />
              <TextInput label="車牌" placeholder="ABC-1234" {...form.getInputProps('carPlate')} />
            </Group>
            <Group grow>
              <NumberInput
                label="基礎價格 (NT$)"
                min={0}
                {...form.getInputProps('basePrice')}
              />
              <NumberInput
                label="每公里加價 (NT$)"
                min={0}
                {...form.getInputProps('pricePerKm')}
              />
            </Group>
            <Button type="submit" loading={update.isPending}>
              儲存
            </Button>
          </Stack>
        </form>
      </Card>

      <LineBindingCard driverId={driverId} />

      <Card withBorder radius="md" p="lg">
        <Stack gap="xs">
          <Title order={4}>專屬預約連結</Title>
          <Text size="sm" c="dimmed">
            把這個連結或 QR Code 給客人，即可直接向你預約。
          </Text>
          <Group>
            <TextInput readOnly value={shareUrl} flex={1} />
            <CopyButton value={shareUrl}>
              {({ copied, copy }) => (
                <Button variant="default" onClick={copy}>
                  {copied ? '已複製' : '複製'}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Center mt="sm">
            <Stack align="center" gap={4}>
              <QRCodeCanvas value={shareUrl} size={160} />
              <Text size="xs" c="dimmed">
                客人掃碼即可預約
              </Text>
            </Stack>
          </Center>
        </Stack>
      </Card>
    </Stack>
  );
}
