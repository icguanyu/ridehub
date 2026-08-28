import { supabaseAdmin } from '../config/supabase.js';
import { monthRange, todayISO } from '../utils/dates.js';
import { ApiError } from '../utils/ApiError.js';
import { getDriverById } from './driverService.js';
import { estimatePrice } from '../utils/pricing.js';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS, TRIP_TYPE } from '../constants.js';

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

// 檢查某日名額；超過上限則丟 409
async function assertDailyCapacity(driver, date, label) {
  const { count, error } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('driver_id', driver.id)
    .or(`booking_date.eq.${date},return_date.eq.${date}`)
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (error) throw error;
  if ((count ?? 0) >= driver.max_daily_bookings) {
    throw ApiError.conflict(`${label}（${date}）預約已額滿，請改選其他日期`);
  }
}

// 客人建立預約（匿名）。回傳建立後的 booking 列。
export async function createBooking(input) {
  const {
    driverId,
    bookingDate,
    bookingTime,
    returnDate,
    returnTime,
    estimatedDistanceKm,
    tripType = TRIP_TYPE.ONE_WAY,
    ...rest
  } = input;

  const driver = await getDriverById(driverId); // 不存在 → 404
  const isRoundTrip = tripType === TRIP_TYPE.ROUND_TRIP;

  // 1. 去程不可為過去
  if (bookingDate < todayISO()) {
    throw ApiError.badRequest('預約日期不可早於今天');
  }

  // 2. 往返：驗證回程
  if (isRoundTrip) {
    if (!returnDate || !returnTime) {
      throw ApiError.badRequest('往返行程需填寫回程日期與時間');
    }
    if (returnDate < bookingDate) {
      throw ApiError.badRequest('回程日期不可早於去程');
    }
    if (returnDate === bookingDate && hhmm(returnTime) <= hhmm(bookingTime)) {
      throw ApiError.badRequest('同日回程時間需晚於去程時間');
    }
  }

  // 3. 名額檢查（去程日；往返且回程跨日則回程日也檢查）
  await assertDailyCapacity(driver, bookingDate, '去程當日');
  if (isRoundTrip && returnDate !== bookingDate) {
    await assertDailyCapacity(driver, returnDate, '回程當日');
  }

  // 5. 預估車資
  const { estimatedPrice } = estimatePrice(driver, { estimatedDistanceKm, tripType });

  // 6. 寫入
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      driver_id: driverId,
      customer_name: rest.customerName,
      customer_phone: rest.customerPhone,
      customer_line_id: rest.customerLineId ?? null,
      trip_type: tripType,
      pickup_location: rest.pickupLocation,
      destination: rest.destination,
      booking_date: bookingDate,
      booking_time: bookingTime,
      return_date: isRoundTrip ? returnDate : null,
      return_time: isRoundTrip ? returnTime : null,
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

// 乘客憑手機號碼查詢自己的所有預約
export async function searchBookingsByPhone(phone) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, trip_type, pickup_location, destination, booking_date, booking_time, drivers(name)')
    .eq('customer_phone', phone)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
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

// 司機重新報價：pending → quoted
export async function quoteBooking(bookingId, driverId, { price, note }) {
  const booking = await getBookingById(bookingId);
  if (booking.driver_id !== driverId) throw ApiError.forbidden('這不是你的預約');
  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw ApiError.conflict(`預約目前為「${booking.status}」，無法報價`);
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: BOOKING_STATUS.QUOTED,
      quoted_price: price,
      quoted_at: new Date().toISOString(),
      quote_note: note ?? null,
    })
    .eq('id', bookingId)
    .eq('status', BOOKING_STATUS.PENDING)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.conflict('預約狀態已被變更，請重新整理');

  return data;
}

// 客人回應司機報價：quoted → accepted / cancelled
export async function respondToQuote(bookingId, { accept }) {
  const booking = await getBookingById(bookingId);
  if (booking.status !== BOOKING_STATUS.QUOTED) {
    throw ApiError.conflict('目前沒有待確認的報價');
  }

  const nextStatus = accept ? BOOKING_STATUS.ACCEPTED : BOOKING_STATUS.CANCELLED;

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: nextStatus })
    .eq('id', bookingId)
    .eq('status', BOOKING_STATUS.QUOTED)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.conflict('預約狀態已被變更，請重新整理');

  return data;
}
