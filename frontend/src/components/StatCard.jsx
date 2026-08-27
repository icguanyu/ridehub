import { Card, Text } from '@mantine/core';

export default function StatCard({ label, value, sub }) {
  return (
    <Card withBorder radius="md" p="md">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="xl" mt={4}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      )}
    </Card>
  );
}
