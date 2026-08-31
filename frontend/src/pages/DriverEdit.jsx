import { useEffect } from 'react';
import {
  Card,
  Stack,
  Title,
  TextInput,
  Textarea,
  Input,
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
import { useFuelPrices } from '@/hooks/useFuelPrices';
import LineBindingCard from '@/components/LineBindingCard';
import Spinner from '@/components/Spinner';
import { ENERGY_TYPE_OPTIONS, energyFieldLabels } from '@/lib/energy';
import { notifyOk, notifyErr } from '@/lib/notify';

const CAR_TYPES = ['轎車', '休旅車', '廂型車', '麵包車'];

export default function DriverEdit() {
  const driverId = useCurrentDriverId();
  const { data, isLoading } = useDriver(driverId);
  const update = useUpdateDriver(driverId);
  const fuel = useFuelPrices();

  const validatePrice = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    if (String(v).trim() === '') return '不可為純空白';
    if (Number(v) < 0) return '不可為負值';
    if (isNaN(Number(v))) return '請輸入有效數字';
    return null;
  };

  const form = useForm({
    initialValues: {
      name: '',
      serviceDescription: '',
      serviceAreas: '',
      carType: '',
      carPlate: '',
      maxPassengers: 4,
      basePrice: '',
      pricePerKm: '',
      lineDisplayId: '',
      energyType: '',
      energyConsumption: '',
      energyUnitPrice: '',
    },
    validate: {
      basePrice: validatePrice,
      pricePerKm: validatePrice,
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
        maxPassengers: data.maxPassengers ?? 4,
        basePrice: data.basePrice ?? '',
        pricePerKm: data.pricePerKm ?? '',
        lineDisplayId: data.lineDisplayId ?? '',
        energyType: data.energyType ?? '',
        energyConsumption: data.energyConsumption ?? '',
        energyUnitPrice: data.energyUnitPrice ?? '',
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
      maxPassengers: Number(v.maxPassengers) || 4,
      basePrice: v.basePrice === '' ? null : Number(v.basePrice),
      pricePerKm: v.pricePerKm === '' ? null : Number(v.pricePerKm),
      lineDisplayId: v.lineDisplayId.trim() || null,
      energyType: v.energyType || null,
      energyConsumption: v.energyConsumption === '' ? null : Number(v.energyConsumption),
      energyUnitPrice: v.energyUnitPrice === '' ? null : Number(v.energyUnitPrice),
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
            <NumberInput
              label="可載客人數上限"
              description="客人預約時的人數不能超過這個數字"
              min={1}
              max={20}
              clampBehavior="strict"
              {...form.getInputProps('maxPassengers')}
            />
            <Group grow>
              <Input.Wrapper label="基礎價格 (NT$)" error={form.errors.basePrice}>
                <Input
                  component="input"
                  type="number"
                  min={0}
                  step="any"
                  value={form.values.basePrice}
                  onChange={(e) => form.setFieldValue('basePrice', e.target.value)}
                  error={!!form.errors.basePrice}
                />
              </Input.Wrapper>
              <Input.Wrapper label="每公里加價 (NT$)" error={form.errors.pricePerKm}>
                <Input
                  component="input"
                  type="number"
                  min={0}
                  step="any"
                  value={form.values.pricePerKm}
                  onChange={(e) => form.setFieldValue('pricePerKm', e.target.value)}
                  error={!!form.errors.pricePerKm}
                />
              </Input.Wrapper>
            </Group>
            <TextInput
              label="LINE ID（選填，客人預約成功後可加好友）"
              placeholder="例如：@mylineid 或 mylineid"
              {...form.getInputProps('lineDisplayId')}
            />

            <Stack gap="xs">
              <Text fw={600} size="sm" c="#4A6152">
                能耗估算（選填，用於試算油／電費，僅供參考）
              </Text>
              <Select
                label="能源類型"
                placeholder="不設定則不試算"
                data={ENERGY_TYPE_OPTIONS}
                clearable
                {...form.getInputProps('energyType')}
              />
              {form.values.energyType && (
                <Group grow>
                  <NumberInput
                    label={energyFieldLabels(form.values.energyType).consumption}
                    min={0}
                    step={0.1}
                    decimalScale={2}
                    {...form.getInputProps('energyConsumption')}
                  />
                  <NumberInput
                    label={energyFieldLabels(form.values.energyType).unitPrice}
                    description={
                      form.values.energyType !== 'ev' && fuel.data?.prices?.[form.values.energyType]
                        ? `留空則用參考油價 NT$${fuel.data.prices[form.values.energyType]}`
                        : form.values.energyType === 'ev'
                          ? '請填你充電的平均每度成本'
                          : undefined
                    }
                    min={0}
                    step={0.1}
                    decimalScale={2}
                    {...form.getInputProps('energyUnitPrice')}
                  />
                </Group>
              )}
            </Stack>

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
            <Stack align="center" gap="sm">
              <QRCodeCanvas value={shareUrl} size={160} />
              <Text size="xs" c="dimmed">
                客人掃碼即可預約
              </Text>
              <Button
                variant="default"
                size="xs"
                component="a"
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                開啟預約頁面
              </Button>
            </Stack>
          </Center>
        </Stack>
      </Card>
    </Stack>
  );
}
