import { createTheme } from '@mantine/core';

// 品牌配色
//   #0F3D2E 深綠   #2E7D32 綠(主色)   #8BC34A 萊姆綠
//   #FFB74D 暖橘    #FAF7EB 米白(底色)

const brand = [
  '#f0f7ef',
  '#dbece0',
  '#b8dcb5',
  '#92c78e',
  '#70b36c',
  '#4c9d4d',
  '#2e7d32', // 6 主色
  '#25692b',
  '#1a5225',
  '#0f3d2e', // 9 深綠
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
  '#ffb74d', // 6
  '#f5a63a',
  '#e08e26',
  '#c26f12',
];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  autoContrast: true,
  defaultRadius: 'md',
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
  colors: { brand, leaf, sun },
  other: { pageBg: '#faf7eb' },
});
