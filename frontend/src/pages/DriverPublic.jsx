import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Center,
  Box,
  Stack,
  Card,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Divider,
} from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { usePublicDriver } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import { fmtMoney } from '@/lib/format';

export default function DriverPublic() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicDriver(driverId);

  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={420}>
        <Text ta="center" fw={700} size="xl" c="brand.7" mb="lg">
          RideHub
        </Text>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <Card withBorder p="lg">
            <Text c="dimmed">找不到這位司機，連結可能有誤。</Text>
          </Card>
        ) : (
          <Stack>
            <Card withBorder shadow="sm" radius="md" p="lg">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={3}>{data.name}</Title>
                  {data.isVerified && (
                    <Badge color="teal" variant="light">
                      已驗證
                    </Badge>
                  )}
                </Group>

                {data.serviceDescription && <Text size="sm">{data.serviceDescription}</Text>}

                <Divider />

                <Group gap="xl">
                  {data.carType && (
                    <div>
                      <Text size="xs" c="dimmed">
                        車型
                      </Text>
                      <Text size="sm">
                        {data.carType}
                        {data.carPlate ? `・${data.carPlate}` : ''}
                      </Text>
                    </div>
                  )}
                  {(data.operatingHoursStart || data.operatingHoursEnd) && (
                    <div>
                      <Text size="xs" c="dimmed">
                        營運時間
                      </Text>
                      <Text size="sm">
                        {data.operatingHoursStart ?? '—'} ~ {data.operatingHoursEnd ?? '—'}
                      </Text>
                    </div>
                  )}
                </Group>

                {data.serviceAreas && (
                  <div>
                    <Text size="xs" c="dimmed">
                      服務區域
                    </Text>
                    <Text size="sm">{data.serviceAreas}</Text>
                  </div>
                )}

                <div>
                  <Text size="xs" c="dimmed">
                    參考價格
                  </Text>
                  <Text size="sm">
                    起價 {fmtMoney(data.basePrice)}
                    {data.pricePerKm ? `，每公里 +${fmtMoney(data.pricePerKm)}` : ''}
                  </Text>
                </div>

                <Button mt="sm" fullWidth onClick={() => navigate(`/driver/${driverId}/book`)}>
                  預約此司機
                </Button>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg">
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  掃碼分享此頁
                </Text>
                <QRCodeCanvas value={window.location.href} size={140} />
              </Stack>
            </Card>

            <Text ta="center" size="xs" c="dimmed">
              你是司機？{' '}
              <Link to="/login">登入後台</Link>
            </Text>
          </Stack>
        )}
      </Box>
    </Center>
  );
}
