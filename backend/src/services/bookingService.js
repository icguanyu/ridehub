import { supabaseAdmin } from '../config/supabase.js';
import { monthRange } from '../utils/dates.js';

// 司機的預約列表：可依 status、month（YYYY-MM）過濾，分頁。
export async function listDriverBookings(driverId, { status, month, page = 1, pageSize = 20 }) {
  let query = supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('driver_id', driverId);

  if (status) query = query.eq('status', status);

  if (month) {
    const { start, endExclusive } = monthRange(month);
    query = query.gte('booking_date', start).lt('booking_date', endExclusive);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    rows: data ?? [],
    pagination: { total: count ?? 0, page, pageSize },
  };
}
