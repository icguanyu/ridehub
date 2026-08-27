import { supabaseAdmin } from '../config/supabase.js';
import { monthRange, todayISO } from '../utils/dates.js';
import { ApiError } from '../utils/ApiError.js';
import { getDriverById } from './driverService.js';
import { estimatePrice } from '../utils/pricing.js';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS } from '../constants.js';

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

const withinOperatingHours = (driver, time) => {
  if (!driver.operating_hours_start || !driver.operating_hours_end) return true; // 未設定則不限制
  const t = time.slice(0, 5);
  return t >= driver.operating_hours_start.slice(0, 5) && t <= driver.operating_hours_end.slice(0, 5);
};

// 客人建立預約（匿名）。回傳建立後的 booking 列。
export async function createBooking(input) {
  const {
    driverId,
    bookingDate,
    bookingTime,
    estimatedDistanceKm,
    ...rest
  } = input;

  const driver = await getDriverById(driverId); // 不存在 → 404

  // 1. 不可預約過去的日期
  if (bookingDate < todayISO()) {
    throw ApiError.badRequest('預約日期不可早於今天');
  }

  // 2. 需在營運時間內
  if (!withinOperatingHours(driver, bookingTime)) {
    throw ApiError.badRequest(
      `預約時間需在營運時間內（${driver.operating_hours_start?.slice(0, 5)}–${driver.operating_hours_end?.slice(0, 5)}）`,
    );
  }

  // 3. 當日名額檢查
  const { count, error: cErr } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', driverId)
    .eq('booking_date', bookingDate)
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (cErr) throw cErr;
  if ((count ?? 0) >= driver.max_daily_bookings) {
    throw ApiError.conflict('該日預約已額滿，請改選其他日期');
  }

  // 4. 預估車資
  const { estimatedPrice } = estimatePrice(driver, { estimatedDistanceKm });

  // 5. 寫入
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      driver_id: driverId,
      customer_name: rest.customerName,
      customer_phone: rest.customerPhone,
      customer_line_id: rest.customerLineId ?? null,
      pickup_location: rest.pickupLocation,
      destination: rest.destination,
      booking_date: bookingDate,
      booking_time: bookingTime,
      passenger_count: rest.passengerCount ?? 1,
      special_requests: rest.specialRequests ?? null,
      estimated_price: estimatedPrice,
      status: BOOKING_STATUS.PENDING,
    })
    .select('*')
    .single();
  if (error) throw error;

  return { booking: data, driver };
}

// 客人查詢單筆預約（含司機聯絡資訊）
export async function getBookingWithDriver(bookingId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, drivers ( name, phone, line_id )')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound('找不到預約');
  return data;
}

// 依 id 取預約（後端內部用）
export async function getBookingById(bookingId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound('找不到預約');
  return data;
}

// 司機回應預約（接受 / 拒絕）。只有 pending 可操作，且需為該預約的司機本人。
export async function respondToBooking(bookingId, driverId, { accept, reason }) {
  const booking = await getBookingById(bookingId);
  if (booking.driver_id !== driverId) throw ApiError.forbidden('這不是你的預約');
  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw ApiError.conflict(`預約目前為「${booking.status}」，無法變更`);
  }

  const patch = accept
    ? { status: BOOKING_STATUS.ACCEPTED }
    : { status: BOOKING_STATUS.REJECTED, rejected_reason: reason ?? null };

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update(patch)
    .eq('id', bookingId)
    .eq('status', BOOKING_STATUS.PENDING) // 樂觀鎖：避免競態重複處理
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.conflict('預約狀態已被變更，請重新整理');

  return data;
}
