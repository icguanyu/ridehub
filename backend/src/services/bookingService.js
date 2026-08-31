import { supabaseAdmin } from '../config/supabase.js';
import { monthRange, todayISO, localNowMinute } from '../utils/dates.js';
import { ApiError } from '../utils/ApiError.js';
import { getDriverById } from './driverService.js';
import { estimatePrice, estimateEnergyCost } from '../utils/pricing.js';
import { getFuelPrices, resolveUnitPrice } from './fuelPriceService.js';
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUS,
  CANCELLABLE_BOOKING_STATUSES,
  TRIP_TYPE,
} from '../constants.js';

const hm = (t) => String(t).slice(0, 5);

// 距離 → 能耗成本快照（抓不到油價不擋流程）
async function energySnapshot(driver, distanceKm, tripType) {
  const km = distanceKm != null && distanceKm !== '' ? Number(distanceKm) : null;
  if (!(km > 0) || !driver.energy_type) return { km, cost: null };
  try {
    const { prices } = await getFuelPrices();
    const unitPrice = resolveUnitPrice(driver, prices);
    return { km, cost: estimateEnergyCost(driver, { distanceKm: km, tripType, unitPrice }) };
  } catch {
    return { km, cost: estimateEnergyCost(driver, { distanceKm: km, tripType }) };
  }
}

// 司機的預約列表：可依 status、month（YYYY-MM）過濾，分頁。
export async function listDriverBookings(driverId, { status, month, page = 1, pageSize = 20 }) {
  let query = supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('driver_id', driverId)
    .is('deleted_at', null);

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
    .is('deleted_at', null)
    .or(`booking_date.eq.${date},return_date.eq.${date}`)
    .in('status', ACTIVE_BOOKING_STATUSES);
  if (error) throw error;
  if ((count ?? 0) >= driver.max_daily_bookings) {
    throw ApiError.conflict(`${label}（${date}）預約已額滿，請改選其他日期`);
  }
}

// 人數不得超過司機可載客上限
function assertPassengerCount(driver, count) {
  const max = driver.max_passengers ?? 20;
  if (Number(count) > max) {
    throw ApiError.badRequest(`人數超過司機可載客上限（最多 ${max} 人）`);
  }
}

// 去程 / 回程 日期時間的共用驗證
function assertTripDates({ bookingDate, bookingTime, returnDate, returnTime, isRoundTrip }) {
  if (bookingDate < todayISO()) {
    throw ApiError.badRequest('預約日期不可早於今天');
  }
  if (isRoundTrip) {
    if (!returnDate || !returnTime) {
      throw ApiError.badRequest('往返行程需填寫回程日期與時間');
    }
    if (returnDate < bookingDate) {
      throw ApiError.badRequest('回程日期不可早於去程');
    }
    if (returnDate === bookingDate && hm(returnTime) <= hm(bookingTime)) {
      throw ApiError.badRequest('同日回程時間需晚於去程時間');
    }
  }
}

// 依 input 組出要寫進 bookings 的欄位（不含 status / 價格）
function bookingRow({ driverId, tripType, isRoundTrip, bookingDate, bookingTime, returnDate, returnTime, rest }) {
  return {
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
  };
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

  assertTripDates({ bookingDate, bookingTime, returnDate, returnTime, isRoundTrip });
  assertPassengerCount(driver, rest.passengerCount ?? 1);

  // 名額檢查（去程日；往返且回程跨日則回程日也檢查）
  await assertDailyCapacity(driver, bookingDate, '去程當日');
  if (isRoundTrip && returnDate !== bookingDate) {
    await assertDailyCapacity(driver, returnDate, '回程當日');
  }

  const { estimatedPrice } = estimatePrice(driver, { estimatedDistanceKm, tripType });
  const energy = await energySnapshot(driver, estimatedDistanceKm, tripType);

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      ...bookingRow({ driverId, tripType, isRoundTrip, bookingDate, bookingTime, returnDate, returnTime, rest }),
      estimated_price: estimatedPrice,
      estimated_distance_km: energy.km,
      estimated_energy_cost: energy.cost,
      status: BOOKING_STATUS.PENDING,
    })
    .select('*')
    .single();
  if (error) throw error;

  return { booking: data, driver };
}

// 司機在後台自建訂單（客人已談好，只是懶得自己輸入）。
// 直接進 accepted、不做名額檢查；車資可自填，未填則沿用估價。
export async function createDriverBooking(driverId, input) {
  const {
    bookingDate,
    bookingTime,
    returnDate,
    returnTime,
    estimatedDistanceKm,
    agreedPrice,
    tripType = TRIP_TYPE.ONE_WAY,
    ...rest
  } = input;

  const driver = await getDriverById(driverId);
  const isRoundTrip = tripType === TRIP_TYPE.ROUND_TRIP;

  assertTripDates({ bookingDate, bookingTime, returnDate, returnTime, isRoundTrip });
  assertPassengerCount(driver, rest.passengerCount ?? 1);

  const price =
    agreedPrice != null && agreedPrice !== ''
      ? Math.round(Number(agreedPrice))
      : estimatePrice(driver, { estimatedDistanceKm, tripType }).estimatedPrice;
  const energy = await energySnapshot(driver, estimatedDistanceKm, tripType);

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      ...bookingRow({ driverId, tripType, isRoundTrip, bookingDate, bookingTime, returnDate, returnTime, rest }),
      estimated_price: price,
      estimated_distance_km: energy.km,
      estimated_energy_cost: energy.cost,
      status: BOOKING_STATUS.ACCEPTED,
    })
    .select('*')
    .single();
  if (error) throw error;

  return data;
}

// 客人查詢單筆預約（含司機聯絡資訊）。
// 已軟刪的仍會回傳（帶 deleted_at），讓客人看到「已被移除」而非 404。
export async function getBookingWithDriver(bookingId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, drivers!bookings_driver_id_fkey ( name, phone, line_id, line_display_id )')
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
    .select(
      'id, status, trip_type, pickup_location, destination, booking_date, booking_time, return_date, return_time, drivers!bookings_driver_id_fkey(name)',
    )
    .eq('customer_phone', phone)
    .is('deleted_at', null)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// 依 id 取預約（後端內部用）。已軟刪的視為不存在。
export async function getBookingById(bookingId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .is('deleted_at', null)
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

// 司機取消預約（帶理由）：pending / quoted / accepted → cancelled
export async function cancelBooking(bookingId, driverId, { reason }) {
  const booking = await getBookingById(bookingId);
  if (booking.driver_id !== driverId) throw ApiError.forbidden('這不是你的預約');
  if (!CANCELLABLE_BOOKING_STATUSES.includes(booking.status)) {
    throw ApiError.conflict(`預約目前為「${booking.status}」，無法取消`);
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: BOOKING_STATUS.CANCELLED,
      cancelled_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .in('status', CANCELLABLE_BOOKING_STATUSES) // 樂觀鎖
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.conflict('預約狀態已被變更，請重新整理');

  return data;
}

// 司機標記行程完成：accepted → completed
export async function completeBooking(bookingId, driverId) {
  const booking = await getBookingById(bookingId);
  if (booking.driver_id !== driverId) throw ApiError.forbidden('這不是你的預約');
  if (booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw ApiError.conflict(`預約目前為「${booking.status}」，無法標記完成`);
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: BOOKING_STATUS.COMPLETED,
      completed_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('status', BOOKING_STATUS.ACCEPTED) // 樂觀鎖
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

// 司機刪除行程（軟刪）。僅預約司機本人、且去程尚未開始才可刪。
// 保留資料列供日後統計（信用率、刪除紀錄）；所有查詢會過濾 deleted_at。
export async function deleteBooking(bookingId, driverId) {
  const booking = await getBookingById(bookingId); // 已過濾 deleted_at → 重複刪會 404
  if (booking.driver_id !== driverId) throw ApiError.forbidden('這不是你的預約');

  const departure = `${booking.booking_date}T${hm(booking.booking_time)}`;
  if (departure <= localNowMinute()) {
    throw ApiError.badRequest('行程已開始或已結束，無法刪除');
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ deleted_at: new Date().toISOString(), deleted_by: driverId })
    .eq('id', bookingId)
    .is('deleted_at', null) // 樂觀鎖
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.conflict('行程已被刪除，請重新整理');

  return { id: bookingId };
}
