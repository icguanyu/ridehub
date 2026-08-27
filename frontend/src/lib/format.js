export const fmtMoney = (n) => `NT$${Number(n ?? 0).toLocaleString('zh-TW')}`;

export const fmtDateTime = (date, time) => `${date ?? ''} ${(time ?? '').slice(0, 5)}`.trim();

export const STATUS_LABEL = {
  pending: '待確認',
  accepted: '已接受',
  rejected: '已拒絕',
  completed: '已完成',
  cancelled: '已取消',
};

export const STATUS_COLOR = {
  pending: 'yellow',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'gray',
};
