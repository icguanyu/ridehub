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
import { useNavigate, Link } from 'react-router-dom';
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

export default function MyBookings() {
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
    <Center px="md" py="xl" style={{ minHeight: 'calc(100dvh - 120px)', alignItems: 'flex-start' }}>
      <Box w="100%" maw={460}>
        <Stack gap={32}>
          <Stack gap={4} align="center" pt="md">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Wordmark size={26} withMark markSize={32} />
            </Link>
          </Stack>

          <div>
            <Title order={1} mb={4} style={{ fontSize: 20, color: '#0F3D2E' }}>
              查詢我的行程
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              輸入預約時填寫的手機號碼，即可查看所有行程狀態。
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
                  autoFocus
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
        </Stack>
      </Box>
    </Center>
  );
}
