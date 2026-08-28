export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

export const TRIP_TYPE = Object.freeze({
  ONE_WAY: 'one_way',
  ROUND_TRIP: 'round_trip',
});

export const TRIP_TYPE_VALUES = Object.values(TRIP_TYPE);

// 佔用當日名額的狀態（用於營運量能計算）
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.QUOTED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.COMPLETED,
];

// 視為「成交」的狀態（用於收入 / 成交統計）
export const FULFILLED_BOOKING_STATUSES = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.COMPLETED,
];

// 司機可主動取消的狀態（已拒絕 / 已完成 / 已取消 不可再取消）
export const CANCELLABLE_BOOKING_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.QUOTED,
  BOOKING_STATUS.ACCEPTED,
];
