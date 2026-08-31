import { Center, Box, Stack, Title, Text, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import Wordmark from '@/components/Wordmark';

const STEPS = [
  '司機建立專屬服務頁，填入車型、服務區域與參考價格。',
  '把預約連結或 QR Code 分享給乘客。',
  '乘客線上填寫行程，司機確認或重新報價，雙方用 LINE 聯繫。',
];

const FEATURES = [
  '依上車／目的地自動估算距離、車程與參考車資',
  '油錢／電費試算，方便司機抓報價（僅供參考）',
  '司機可自建訂單、標記完成、設定可載客人數上限',
  '單程／往返分開呈現，行程狀態即時查看',
];

export default function HomePage() {
  return (
    <Center px="md" py="xl" style={{ background: '#FAF7EB', minHeight: 'calc(100dvh - 120px)', alignItems: 'flex-start' }}>
      <Box w="100%" maw={460}>
        <Stack gap={48}>

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
              即時掌握狀態；系統自動估算距離與參考車資，雙方透過 LINE 聯繫。
              免費、免下載 App。
            </Text>
          </Stack>

          {/* 入口 */}
          <Stack gap="sm">
            <Box
              style={{
                border: '1px solid #E4E0D0',
                borderRadius: 16,
                padding: '20px 18px',
                background: '#fff',
              }}
            >
              <Title order={2} mb={4} style={{ fontSize: 17, color: '#0F3D2E' }}>
                乘客：查詢我的行程
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                輸入手機號碼，即可查看所有行程狀態。
              </Text>
              <Button component={Link} to="/my-bookings" color="brand" fullWidth>
                查詢行程
              </Button>
            </Box>

            <Box
              style={{
                border: '1px solid #E4E0D0',
                borderRadius: 16,
                padding: '20px 18px',
                background: '#fff',
              }}
            >
              <Title order={2} mb={4} style={{ fontSize: 17, color: '#0F3D2E' }}>
                司機：建立你的服務頁
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                開始線上收單，管理每一筆預約。
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

          {/* 特色 */}
          <div>
            <Title order={2} mb="sm" style={{ fontSize: 15, color: '#4A6152' }}>
              特色
            </Title>
            <Stack gap="xs">
              {FEATURES.map((f, i) => (
                <Group key={i} gap={8} wrap="nowrap" align="flex-start">
                  <Text style={{ flex: 'none', color: '#2E7D32', lineHeight: 1.6 }}>✓</Text>
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    {f}
                  </Text>
                </Group>
              ))}
            </Stack>
          </div>

          {/* 怎麼運作 */}
          <div>
            <Title order={2} mb="sm" style={{ fontSize: 15, color: '#4A6152' }}>
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

        </Stack>
      </Box>
    </Center>
  );
}
