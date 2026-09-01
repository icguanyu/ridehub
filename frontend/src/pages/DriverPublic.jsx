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
  Avatar,
} from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { usePublicDriver } from '@/hooks/useCustomer';
import Spinner from '@/components/Spinner';
import Wordmark from '@/components/Wordmark';
import { fmtMoney } from '@/lib/format';

export default function DriverPublic() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicDriver(driverId);

  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={420}>
        <Center mb="lg">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={30} withMark markSize={38} slogan />
          </Link>
        </Center>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <Card p="lg">
            <Text c="dimmed">找不到這位司機，連結可能有誤。</Text>
          </Card>
        ) : (
          <Stack>
            <Card radius="xl" p="lg">
              <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      src={data.avatarUrl || null}
                      name={data.name}
                      size={56}
                      radius="50%"
                      color="teal"
                    />
                    <Title order={3}>{data.name}</Title>
                  </Group>
                  <Group gap={6} wrap="nowrap">
                    {data.isVerified && (
                      <Badge color="teal" variant="light">
                        已驗證
                      </Badge>
                    )}
                    {data.photoVerified && (
                      <Badge color="green" variant="light" size="sm">
                        ✓ 真人大頭照
                      </Badge>
                    )}
                  </Group>
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

                </Group>

                {data.serviceAreas && (
                  <div>
                    <Text size="xs" c="dimmed">
                      服務區域
                    </Text>
                    <Text size="sm">{data.serviceAreas}</Text>
                  </div>
                )}

                {data.passengerInsuranceWan > 0 && (
                  <div>
                    <Text size="xs" c="dimmed">
                      乘客責任險
                    </Text>
                    <Text size="sm">保額 {data.passengerInsuranceWan} 萬</Text>
                  </div>
                )}

                <div>
                  <Text size="xs" c="dimmed">
                    參考價格
                  </Text>
                  <Text size="sm">
                    起價 <span className="mono">{fmtMoney(data.basePrice)}</span>
                    {data.pricePerKm ? (
                      <>
                        ，每公里 +<span className="mono">{fmtMoney(data.pricePerKm)}</span>
                      </>
                    ) : (
                      ''
                    )}
                  </Text>
                </div>

                <Button mt="sm" size="md" fullWidth onClick={() => navigate(`/driver/${driverId}/book`)}>
                  預約此司機
                </Button>
              </Stack>
            </Card>

            <Card radius="xl" p="lg">
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  掃碼分享此頁
                </Text>
                <QRCodeCanvas value={window.location.href} size={140} fgColor="#0F3D2E" />
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
