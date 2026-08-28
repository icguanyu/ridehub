import { Card, Text } from '@mantine/core';

// 深綠底、mono 數字 —— 對應視覺主題的統計卡。
export default function StatCard({ label, value, sub }) {
  return (
    <Card radius="lg" p="md" withBorder={false} style={{ background: '#0F3D2E' }}>
      <Text size="xs" style={{ color: '#8BC34A', letterSpacing: '0.12em' }}>
        {label}
      </Text>
      <Text
        className="mono"
        fw={500}
        mt={6}
        style={{ color: '#FAF7EB', fontSize: 22, lineHeight: 1.1 }}
      >
        {value}
      </Text>
      {sub && (
        <Text size="xs" mt={4} style={{ color: '#B9CFB3' }}>
          {sub}
        </Text>
      )}
    </Card>
  );
}
