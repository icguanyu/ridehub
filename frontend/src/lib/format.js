export const fmtMoney = (n) => `NT$${Number(n ?? 0).toLocaleString('zh-TW')}`;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const weekday = (date) => {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getDay()];
};

// 2026-08-30 (週六)
export const fmtDate = (date) => (date ? `${date} (週${weekday(date)})` : '');

// 2026-08-30 (週六) 09:00
export const fmtDateTime = (date, time) =>
  date ? `${fmtDate(date)} ${(time ?? '').slice(0, 5)}`.trim() : '';

// 8月30日（週六）
export const fmtDateFull = (date) => {
  if (!date) return '';
  const [, m, d] = date.split('-');
  return `${Number(m)}月${Number(d)}日（週${weekday(date)}）`;
};

export const STATUS_LABEL = {
  pending: '待確認',
  quoted: '待客人確認報價',
  accepted: '已接受',
  rejected: '已拒絕',
  completed: '已完成',
  cancelled: '已取消',
};

export const STATUS_COLOR = {
  pending: 'yellow',
  quoted: 'orange',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'gray',
};

export const TRIP_TYPE_LABEL = {
  one_way: '單程',
  round_trip: '往返',
};
