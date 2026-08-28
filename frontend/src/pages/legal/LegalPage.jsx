import { Link } from 'react-router-dom';
import { Center, Box, Stack, Title, Text } from '@mantine/core';
import Wordmark from '@/components/Wordmark';

// 法律頁共用外框（隱私權政策 / 免責聲明）。底部 footer 由 PublicLayout 提供。
export default function LegalPage({ title, updated, children }) {
  return (
    <Center mih="100vh" px="md" py="xl" style={{ alignItems: 'flex-start' }}>
      <Box w="100%" maw={640}>
        <Center mb="xl">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={26} withMark markSize={32} />
          </Link>
        </Center>

        <Title order={2} mb={4}>
          {title}
        </Title>
        <Text size="xs" c="dimmed" mb="xl">
          最後更新：{updated}
        </Text>

        <Stack gap="xl">{children}</Stack>
      </Box>
    </Center>
  );
}

export function Section({ heading, children }) {
  return (
    <div>
      <Title order={4} mb="xs">
        {heading}
      </Title>
      <Stack gap="sm">{children}</Stack>
    </div>
  );
}

export function P({ children }) {
  return (
    <Text size="sm" style={{ lineHeight: 1.7 }}>
      {children}
    </Text>
  );
}
