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
          隱私權政策
        </Anchor>
        <Text size="xs" c="dimmed">·</Text>
        <Anchor component={Link} to="/disclaimer" size="xs" c="dimmed">
          免責聲明
        </Anchor>
      </Group>
      <Text ta="center" size="xs" c="dimmed" mt={8} maw={520} mx="auto">
        RideHub 僅為媒合資訊平台，不參與交易、不收取費用，亦不對司機與乘客間之
        運送安全、車輛狀況、保險或任何糾紛負責。使用者應自行評估風險。
      </Text>
      <Text ta="center" size="xs" c="dimmed" mt={4}>
        © {new Date().getFullYear()} RideHub
      </Text>
    </Box>
  );
}
