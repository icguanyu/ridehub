export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

// 佔用當日名額的狀態（用於營運量能計算）
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.COMPLETED,
];

// 視為「成交」的狀態（用於收入 / 成交統計）
export const FULFILLED_BOOKING_STATUSES = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.COMPLETED,
];
