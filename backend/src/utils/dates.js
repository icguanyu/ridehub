// 把 "YYYY-MM" 轉成該月的起訖日（含首、不含次月首日）。
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const endExclusive = `${nextMonth}-01`;
  return { start, endExclusive };
}

// 目前台北時間。台灣固定 UTC+8、無日光節約，直接位移即可。
const taipeiNow = () => new Date(Date.now() + 8 * 60 * 60 * 1000);

// 台北「今天」的 YYYY-MM-DD
export function todayISO() {
  return taipeiNow().toISOString().slice(0, 10);
}

// 台北當月 YYYY-MM
export function currentMonth() {
  return taipeiNow().toISOString().slice(0, 7);
}

// 台北目前掛鐘時間 YYYY-MM-DDTHH:mm，可直接和 booking_date + booking_time 比較。
export function taipeiNowMinute() {
  return taipeiNow().toISOString().slice(0, 16);
}
