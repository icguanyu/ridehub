// 營運時區。需與後端 APP_TIMEZONE 一致，否則前端顯示/判斷會和後端不同調。
export const APP_TZ = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Taipei';

function nowParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ,
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

// 營運時區的現在 YYYY-MM-DDTHH:mm（可直接和 bookingDate + bookingTime 字串比較）
export function nowMinute() {
  const { year, month, day, hour, minute } = nowParts();
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// 兩個「同一時區的掛鐘時間字串」相差幾分鐘（正 = 未來）。
// 兩邊都當成 UTC 解析，時區位移相互抵消。
export function minutesBetween(fromMinute, toMinute) {
  const ms = new Date(`${toMinute}Z`).getTime() - new Date(`${fromMinute}Z`).getTime();
  return Math.round(ms / 60000);
}
