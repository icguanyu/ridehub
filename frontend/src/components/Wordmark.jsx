import { Group, Text } from '@mantine/core';
import LogoMark from './LogoMark';

// RideHub 字標：Ride(深綠) + Hub(森林綠)，Outfit 700。
// withMark 時前面帶標誌圖形；size 控制字級。
export default function Wordmark({ size = 28, withMark = false, markSize, reversed = false, slogan = false }) {
  const rideColor = reversed ? '#FAF7EB' : '#0F3D2E';
  const hubColor = reversed ? '#8BC34A' : '#2E7D32';

  const text = (
    <Text
      component="span"
      style={{
        fontFamily: "'Outfit', 'Noto Sans TC', sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: rideColor }}>Ride</span>
      <span style={{ color: hubColor }}>Hub</span>
    </Text>
  );

  const inner = withMark ? (
    <Group gap={size * 0.35} wrap="nowrap" align="center">
      <LogoMark size={markSize ?? size * 1.25} tone={reversed ? 'reversed' : 'color'} />
      {text}
    </Group>
  ) : (
    text
  );

  if (!slogan) return inner;

  return (
    <Group gap={6} align="center" style={{ flexDirection: 'column' }}>
      {inner}
      <Text
        size="xs"
        style={{
          letterSpacing: '0.22em',
          color: reversed ? '#8BC34A' : '#2E7D32',
        }}
      >
        接駁預約 · 輕鬆出發
      </Text>
    </Group>
  );
}
