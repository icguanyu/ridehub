import { Center, Loader, Group, Text } from '@mantine/core';

export default function Spinner({ label = '載入中…' }) {
  return (
    <Center py="xl">
      <Group gap="xs">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Group>
    </Center>
  );
}
