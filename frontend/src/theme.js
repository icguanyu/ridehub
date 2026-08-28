import { createTheme } from '@mantine/core';

// ── RideHub 視覺主題 ──────────────────────────────
//   #0F3D2E 深森林綠(主色)   #2E7D32 森林綠(輔助)
//   #8BC34A 山林綠(強調)     #FFB74D 日出橙(僅太陽/提醒)
//   #FAF7EB 米白(背景)       #E4E0D0 分隔線   #4A6152 次要文字
//   扁平、無陰影、卡片一律 1px 邊框

const brand = [
  '#eef5ee',
  '#dbece0',
  '#b8dcb5',
  '#92c78e',
  '#70b36c',
  '#4c9d4d',
  '#2e7d32', // 6 輔助色（主要按鈕、連結）
  '#256a2b',
  '#194f22',
  '#0f3d2e', // 9 深森林綠（深底卡片、標題）
];

const leaf = [
  '#f3f9e8',
  '#e4f0cf',
  '#d0e5ab',
  '#bcd985',
  '#a6cd63',
  '#97c94f',
  '#8bc34a', // 6
  '#79ab3f',
  '#669033',
  '#4f7222',
];

const sun = [
  '#fff4e2',
  '#ffe6c4',
  '#ffd7a3',
  '#ffc981',
  '#ffbd66',
  '#ffb357',
  '#ffb74d', // 6 日出橙
  '#f5a63a',
  '#e08e26',
  '#c26f12',
];

// 警示紅（僅 error）
const danger = [
  '#fdeceb',
  '#f8d5d2',
  '#f0aaa4',
  '#e97f76',
  '#e35f54',
  '#e2574c', // 6
  '#cf4a40',
  '#b03c33',
  '#8f302a',
  '#6f2521',
];

const SANS = "'Noto Sans TC', 'Outfit', system-ui, 'PingFang TC', 'Microsoft JhengHei', sans-serif";
const DISPLAY = "'Outfit', 'Noto Sans TC', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  autoContrast: true,
  defaultRadius: 'lg',
  fontFamily: SANS,
  fontFamilyMonospace: MONO,
  headings: { fontFamily: DISPLAY, fontWeight: '700' },
  colors: { brand, leaf, sun, danger },
  // 扁平：所有陰影都拿掉
  shadows: {
    xs: 'none',
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
  },
  radius: {
    xs: '6px',
    sm: '10px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  other: {
    fontDisplay: DISPLAY,
    fontMono: MONO,
    pageBg: '#faf7eb',
    surface: '#ffffff',
    border: '#e4e0d0',
    ink: '#0f3d2e',
    inkSoft: '#4a6152',
    sun: '#ffb74d',
  },
  components: {
    Card: {
      defaultProps: { withBorder: true, shadow: undefined, radius: 'xl' },
    },
    Paper: {
      defaultProps: { shadow: undefined },
    },
    Modal: {
      defaultProps: { radius: 'lg' },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
    Badge: {
      defaultProps: { radius: 'xl' },
    },
    SegmentedControl: {
      defaultProps: { radius: 'md' },
    },
  },
});
