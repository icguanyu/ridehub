// 把 "YYYY-MM" 轉成該月的起訖日（含首、不含次月首日）。
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  const endExclusive = `${nextMonth}-01`;
  return { start, endExclusive };
}

// 今天（伺服器時區）的 YYYY-MM-DD
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// 當月 YYYY-MM
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
