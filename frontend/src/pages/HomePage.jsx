import { useState } from 'react';
import {
  Center,
  Box,
  Stack,
  Title,
  TextInput,
  Button,
  Text,
  Badge,
  Group,
  UnstyledButton,
  Checkbox,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import Wordmark from '@/components/Wordmark';
import TripRoute, { TripTypeBadge } from '@/components/TripRoute';
import { useBookingSearch } from '@/hooks/useCustomer';
import { STATUS_LABEL, STATUS_COLOR, fmtDateTime } from '@/lib/format';
import Spinner from '@/components/Spinner';

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const STEPS = [
  '司機建立專屬服務頁，填入車型、服務區域與參考價格。',
  '把預約連結或 QR Code 分享給乘客。',
  '乘客線上填寫行程，司機確認或重新報價，雙方用 LINE／簡訊聯繫。',
];

function BookingRow({ booking }) {
  const navigate = useNavigate();
  const isRoundTrip = booking.tripType === 'round_trip';

  const go = () => navigate(`/booking/${booking.id}?token=${booking.statusToken}`);

  return (
    <UnstyledButton onClick={go} style={{ width: '100%', textAlign: 'left' }}>
      <Box
        style={{
          border: '1px solid #E4E0D0',
          borderRadius: 16,
          padding: '12px 14px',
          background: '#fff',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2E7D32')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E4E0D0')}
      >
        <Group justify="space-between" mb={6} wrap="nowrap">
          <Group gap={8} wrap="nowrap" align="center">
            <Text size="sm" fw={600} className="mono">
              {fmtDateTime(booking.bookingDate, booking.bookingTime)}
            </Text>
            {isRoundTrip && <TripTypeBadge tripType={booking.tripType} />}
          </Group>
          <Group gap={6} wrap="nowrap">
            <Badge color={STATUS_COLOR[booking.status]} variant="light" size="sm">
              {STATUS_LABEL[booking.status] ?? booking.status}
            </Badge>
            <Text c="dimmed" style={{ lineHeight: 1 }}>
              <ArrowIcon />
            </Text>
          </Group>
        </Group>

        <Box mb={booking.driverName ? 4 : 0}>
          <TripRoute booking={booking} timeMode="omitOutbound" />
        </Box>

        {booking.driverName && (
          <Text size="xs" c="dimmed" ml={24}>
            司機：{booking.driverName}
          </Text>
        )}
      </Box>
    </UnstyledButton>
  );
}

const STORAGE_KEY = 'ridehub_phone';

export default function HomePage() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? '';
  const [inputPhone, setInputPhone] = useState(saved);
  const [remember, setRemember] = useState(Boolean(saved));
  const [searchPhone, setSearchPhone] = useState(/^09\d{8}$/.test(saved) ? saved : '');
  const phoneError = inputPhone && !/^09\d{8}$/.test(inputPhone) ? '手機格式需為 09xxxxxxxx' : null;

  const { data, isLoading, isFetched } = useBookingSearch(searchPhone);

  const handleRemember = (checked) => {
    setRemember(checked);
    if (!checked) localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^09\d{8}$/.test(inputPhone)) return;
    if (remember) localStorage.setItem(STORAGE_KEY, inputPhone);
    else localStorage.removeItem(STORAGE_KEY);
    setSearchPhone(inputPhone);
  };

  return (
    <Center mih="100vh" px="md" py="xl" style={{ background: '#FAF7EB', alignItems: 'flex-start' }}>
      <Box w="100%" maw={460}>
        <Stack gap={40}>
          {/* Hero */}
          <Stack gap="md" align="center" pt="lg">
            <Wordmark size={34} withMark markSize={42} slogan />
            <Title
              order={1}
              ta="center"
              style={{ fontSize: 22, color: '#0F3D2E', lineHeight: 1.4, letterSpacing: '-0.01em' }}
            >
              接送司機與乘客的行程媒合平台
            </Title>
            <Text ta="center" c="dimmed" size="sm" style={{ lineHeight: 1.7 }}>
              RideHub 讓接駁司機建立自己的預約頁，乘客用一個連結就能線上預約行程、
              即時掌握狀態，雙方透過 LINE 或簡訊聯繫。免費、免下載 App。
            </Text>
          </Stack>

          {/* 怎麼運作 */}
          <div>
            <Title order={2} mb="sm" style={{ fontSize: 16, color: '#4A6152' }}>
              怎麼運作
            </Title>
            <Stack gap="sm">
              {STEPS.map((s, i) => (
                <Group key={i} gap={10} wrap="nowrap" align="flex-start">
                  <Box
                    style={{
                      flex: 'none',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#0F3D2E',
                      color: '#FAF7EB',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    {s}
                  </Text>
                </Group>
              ))}
            </Stack>
          </div>

          {/* 查詢我的行程 */}
          <div>
            <Title order={2} mb={4} style={{ fontSize: 18, color: '#0F3D2E' }}>
              查詢我的行程
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              輸入預約時填寫的手機號碼，即可查詢所有行程狀態。
            </Text>

            <form onSubmit={handleSubmit}>
              <Group gap="xs" align="flex-start" mb="xs">
                <TextInput
                  flex={1}
                  placeholder="0912345678"
                  inputMode="tel"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value.trim())}
                  error={phoneError}
                  maxLength={10}
                />
                <Button type="submit" color="brand" disabled={!!phoneError || !inputPhone}>
                  查詢
                </Button>
              </Group>
              <Checkbox
                label="記住我"
                size="xs"
                checked={remember}
                onChange={(e) => handleRemember(e.currentTarget.checked)}
                color="brand"
              />
            </form>

            {isLoading && (
              <Box mt="md">
                <Spinner />
              </Box>
            )}

            {isFetched && data && (
              <Stack gap="sm" mt="md">
                {data.length > 0 ? (
                  <>
                    <Text size="sm" c="dimmed">
                      找到 {data.length} 筆行程
                    </Text>
                    {data.map((b) => (
                      <BookingRow key={b.id} booking={b} />
                    ))}
                  </>
                ) : (
                  <Box
                    style={{
                      border: '1px solid #E4E0D0',
                      borderRadius: 16,
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: '#fff',
                    }}
                  >
                    <Text c="dimmed" size="sm">
                      查無此號碼的行程紀錄
                    </Text>
                  </Box>
                )}
              </Stack>
            )}
          </div>

          {/* 我是司機 */}
          <Box
            style={{
              border: '1px solid #E4E0D0',
              borderRadius: 16,
              padding: '18px 16px',
              background: '#fff',
            }}
          >
            <Title order={2} mb={4} style={{ fontSize: 18, color: '#0F3D2E' }}>
              我是司機
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              建立你的接駁服務頁，開始線上收單，管理每一筆預約。
            </Text>
            <Group gap="xs">
              <Button component={Link} to="/signup" color="brand">
                免費註冊
              </Button>
              <Button component={Link} to="/login" variant="default">
                登入
              </Button>
            </Group>
          </Box>
        </Stack>
      </Box>
    </Center>
  );
}
