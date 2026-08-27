import { supabaseAdmin } from '../config/supabase.js';
import { monthRange } from '../utils/dates.js';
import { FULFILLED_BOOKING_STATUSES } from '../constants.js';

// MVP：直接由 bookings / booking_ratings 即時計算當月統計。
// （driver_stats 預先彙總表保留給日後排程使用。）
export async function getDriverStats(driverId, month) {
  const { start, endExclusive } = monthRange(month);

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, customer_phone, estimated_price')
    .eq('driver_id', driverId)
    .gte('booking_date', start)
    .lt('booking_date', endExclusive);
  if (error) throw error;

  const fulfilled = bookings.filter((b) => FULFILLED_BOOKING_STATUSES.includes(b.status));

  const totalBookings = bookings.length;
  const acceptedBookings = fulfilled.length;
  const totalCustomers = new Set(bookings.map((b) => b.customer_phone)).size;
  const totalRevenue = fulfilled.reduce((sum, b) => sum + Number(b.estimated_price ?? 0), 0);

  let avgRating = 0;
  const ids = bookings.map((b) => b.id);
  if (ids.length) {
    const { data: ratings, error: rErr } = await supabaseAdmin
      .from('booking_ratings')
      .select('rating')
      .in('booking_id', ids);
    if (rErr) throw rErr;
    if (ratings.length) {
      avgRating = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
    }
  }

  return {
    month,
    totalBookings,
    acceptedBookings,
    totalCustomers,
    totalRevenue: Math.round(totalRevenue),
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
