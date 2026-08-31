import { Link } from 'react-router-dom';
import { Center, Stack, Text, Button } from '@mantine/core';
import Wordmark from '@/components/Wordmark';

export default function NotFound() {
  return (
    <Center px="md" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      <Stack align="center" gap="sm" maw={360} w="100%">
        <Wordmark size={26} withMark markSize={32} />
        <Text
          fw={800}
          c="gray.3"
          style={{ fontSize: 'clamp(72px, 20vw, 120px)', lineHeight: 1 }}
        >
          404
        </Text>
        <Text fw={500} size="lg" c="dark.4">
          找不到這個頁面
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          可能是連結已過期，或是網址輸入有誤。
        </Text>
        <Button component={Link} to="/" mt="xs" size="md" radius="xl">
          回首頁
        </Button>
      </Stack>
    </Center>
  );
}
