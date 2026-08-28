// RideHub 標誌圖形：山形 + 道路 + 日出，扁平純色。
// tone="color"（預設，米白底）、tone="reversed"（深綠底用）
export default function LogoMark({ size = 32, tone = 'color', style }) {
  if (tone === 'reversed') {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block', ...style }} aria-hidden>
        <path
          d="M32 3C18.7 3 8 13.7 8 27c0 13.4 15.6 26.6 22.3 33.5a2.4 2.4 0 0 0 3.4 0C40.4 53.6 56 40.4 56 27 56 13.7 45.3 3 32 3Z"
          fill="#FAF7EB"
        />
        <circle cx="32" cy="26" r="16" fill="#0F3D2E" />
        <circle cx="40" cy="18" r="4" fill="#FAF7EB" />
        <path d="M20 33 C25 31.5 24.8 23 28 23 C31.2 23 31 31.5 36 33 Z" fill="#FAF7EB" />
        <path d="M27 33 C33.5 31.5 33.2 25 37 25 C40.8 25 40.5 31.5 46 33 Z" fill="#FAF7EB" />
        <path d="M17.6 33 A16 16 0 0 0 46.4 33 Z" fill="#FAF7EB" />
        <path
          d="M31 33 C31 35.2 26.2 35.8 26.4 38 C26.6 40.2 28.6 40.6 29.3 41.8 A16 16 0 0 0 37.9 40.9 C35.5 39.5 30.5 39.5 30.6 37.5 C30.7 35.5 34 35 34 33 Z"
          fill="#0F3D2E"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block', ...style }} aria-hidden>
      <path
        d="M32 3C18.7 3 8 13.7 8 27c0 13.4 15.6 26.6 22.3 33.5a2.4 2.4 0 0 0 3.4 0C40.4 53.6 56 40.4 56 27 56 13.7 45.3 3 32 3Z"
        fill="#0F3D2E"
      />
      <circle cx="32" cy="26" r="16" fill="#FAF7EB" />
      <circle cx="40" cy="18" r="4" fill="#FFB74D" />
      <path d="M17.6 33 A16 16 0 0 0 46.4 33 Z" fill="#2E7D32" />
      <path d="M20 33 C25 31.5 24.8 23 28 23 C31.2 23 31 31.5 36 33 Z" fill="#8BC34A" />
      <path d="M27 33 C33.5 31.5 33.2 25 37 25 C40.8 25 40.5 31.5 46 33 Z" fill="#0F3D2E" />
      <path
        d="M31 33 C31 35.2 26.2 35.8 26.4 38 C26.6 40.2 28.6 40.6 29.3 41.8 A16 16 0 0 0 37.9 40.9 C35.5 39.5 30.5 39.5 30.6 37.5 C30.7 35.5 34 35 34 33 Z"
        fill="#FAF7EB"
      />
    </svg>
  );
}
