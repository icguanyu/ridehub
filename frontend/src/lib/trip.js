import { nowMinute } from '@/lib/tz';

// 去程是否已開始／過去（以營運時區為準，和後端一致）。
export function isTripStarted(booking) {
  if (!booking?.bookingDate) return false;
  const t = (booking.bookingTime ?? '00:00').slice(0, 5);
  return `${booking.bookingDate}T${t}` <= nowMinute();
}
