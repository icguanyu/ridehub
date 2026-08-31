// 去程是否已開始／過去（前端粗判，最終以後端為準）
export function isTripStarted(booking) {
  if (!booking?.bookingDate) return false;
  const t = (booking.bookingTime ?? '00:00').slice(0, 5);
  return new Date(`${booking.bookingDate}T${t}`) <= new Date();
}
