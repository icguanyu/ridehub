import { Link } from 'react-router-dom';
import { Center, Stack, Text, Button } from '@mantine/core';

export default function NotFound() {
  return (
    <Center mih="70vh" px="md">
      <Stack align="center" gap="xs">
        <Text fw={700} size={48} c="gray.4">
          404
        </Text>
        <Text c="dimmed">找不到這個頁面</Text>
        <Button component={Link} to="/" mt="md">
          回首頁
        </Button>
      </Stack>
    </Center>
  );
}
