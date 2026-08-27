import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { ACTIVE_BOOKING_STATUSES } from '../constants.js';
import { todayISO } from '../utils/dates.js';

export async function getDriverById(driverId) {
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound('找不到司機');
  return data;
}

// patch 已是 snake_case
export async function updateDriver(driverId, patch) {
  if (Object.keys(patch).length === 0) return getDriverById(driverId);

  const { data, error } = await supabaseAdmin
    .from('drivers')
    .update(patch)
    .eq('id', driverId)
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw ApiError.conflict('資料重複');
    throw error;
  }
  if (!data) throw ApiError.notFound('找不到司機');
  return data;
}

export async function bindLineId(driverId, lineId) {
  return updateDriver(driverId, { line_id: lineId });
}

export async function getAvailability(driverId) {
  const driver = await getDriverById(driverId);

  const { count, error } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .eq('booking_date', todayISO())
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (error) throw error;

  // Postgres TIME 會回 "HH:MM:SS"，裁成 "HH:MM"
  const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

  return {
    operatingHoursStart: hhmm(driver.operating_hours_start),
    operatingHoursEnd: hhmm(driver.operating_hours_end),
    maxDailyBookings: driver.max_daily_bookings,
    bookedTodayCount: count ?? 0,
  };
}

export async function updateAvailability(driverId, { operatingHoursStart, operatingHoursEnd, maxDailyBookings }) {
  const patch = {};
  if (operatingHoursStart !== undefined) patch.operating_hours_start = operatingHoursStart;
  if (operatingHoursEnd !== undefined) patch.operating_hours_end = operatingHoursEnd;
  if (maxDailyBookings !== undefined) patch.max_daily_bookings = maxDailyBookings;

  await updateDriver(driverId, patch);
  return getAvailability(driverId);
}
