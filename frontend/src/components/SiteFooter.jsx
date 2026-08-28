import { Link } from 'react-router-dom';
import { Box, Group, Anchor, Text } from '@mantine/core';

// 全站底部：法律連結 + 一句免責摘要。
export default function SiteFooter() {
  return (
    <Box
      component="footer"
      py="lg"
      px="md"
      style={{ borderTop: '1px solid #E4E0D0', background: '#FAF7EB' }}
    >
      <Group justify="center" gap={10}>
        <Anchor component={Link} to="/privacy" size="xs" c="dimmed">
          隱私說明
        </Anchor>
        <Text size="xs" c="dimmed">·</Text>
        <Anchor component={Link} to="/disclaimer" size="xs" c="dimmed">
          使用須知
        </Anchor>
      </Group>
      <Text ta="center" size="xs" c="dimmed" mt={8} maw={520} mx="auto">
        RideHub 是免費試用中的媒合工具，不參與交易也不負責乘車安全，
        請自行評估對象與風險。
      </Text>
      <Text ta="center" size="xs" c="dimmed" mt={4}>
        © {new Date().getFullYear()} RideHub
      </Text>
    </Box>
  );
}
