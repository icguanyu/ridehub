// 所有「今天 / 現在」一律以 config.timezone（APP_TIMEZONE）為準。
// 用具名時區 + Intl，才能正確處理日光節約（固定數字位移在有 DST 的地區會錯）。
import { config } from '../config/index.js';

// 把 "YYYY-MM" 轉成該月的起訖日（含首、不含次月首日）。
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const endExclusive = `${nextMonth}-01`;
  return { start, endExclusive };
}

// 取得營運時區「現在」的日期時間分量。
function nowParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
}

// 營運時區的今天 YYYY-MM-DD
export function todayISO() {
  const { year, month, day } = nowParts();
  return `${year}-${month}-${day}`;
}

// 營運時區的當月 YYYY-MM
export function currentMonth() {
  const { year, month } = nowParts();
  return `${year}-${month}`;
}

// 營運時區目前掛鐘時間 YYYY-MM-DDTHH:mm，可直接和 booking_date + booking_time 字串比較。
export function localNowMinute() {
  const { year, month, day, hour, minute } = nowParts();
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
