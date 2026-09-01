import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import { signAdminToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { monthRange, currentMonth } from '../utils/dates.js';
import { FULFILLED_BOOKING_STATUSES } from '../constants.js';
import { agreedPrice } from '../utils/pricing.js';
import { driverPrivate } from '../serializers/driver.js';
import { bookingItem } from '../serializers/booking.js';
import { getDriverStats } from './statsService.js';
import { avatarPublicUrl } from './storageService.js';
import { recomputeTrust } from './verificationService.js';

// ── 登入 ────────────────────────────
export async function adminLogin({ email, password }) {
  const e = String(email).trim().toLowerCase();
  const bad = ApiError.unauthorized('帳號或密碼錯誤');
  if (!config.adminEmails.includes(e)) throw bad;

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email: e, password });
  if (error || !data?.session) throw bad;

  return { token: signAdminToken(e), email: e };
}

export async function logAdminAction(actorEmail, action, targetType, targetId, detail) {
  const { error } = await supabaseAdmin
    .from('admin_actions')
    .insert({ actor_email: actorEmail, action, target_type: targetType, target_id: targetId, detail });
  if (error) logger.error('寫入 admin_actions 失敗', error.message);
}

// ── 平台總覽 ─────────────────────────
export async function getOverview(month = currentMonth()) {
  const { start, endExclusive } = monthRange(month);

  const { count: driversTotal, error: dErr } = await supabaseAdmin
    .from('drivers')
    .select('id', { count: 'exact', head: true });
  if (dErr) throw dErr;

  const { data: rows, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('driver_id, status, estimated_price, quoted_price')
    .is('deleted_at', null)
    .gte('booking_date', start)
    .lt('booking_date', endExclusive);
  if (bErr) throw bErr;

  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  const gmv = rows
    .filter((r) => FULFILLED_BOOKING_STATUSES.includes(r.status))
    .reduce((s, r) => s + Number(agreedPrice(r) ?? 0), 0);

  return {
    month,
    drivers: { total: driversTotal ?? 0, activeThisMonth: new Set(rows.map((r) => r.driver_id)).size },
    bookings: { total: rows.length, byStatus, gmv: Math.round(gmv) },
  };
}

// ── 司機列表 ─────────────────────────
export async function listDrivers({ search, page = 1, pageSize = 20 }) {
  let q = supabaseAdmin
    .from('drivers')
    .select('id, name, phone, email, is_verified, suspended_at, created_at', { count: 'exact' });

  if (search) {
    const s = `%${search}%`;
    q = q.or(`name.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
  }

  const from = (page - 1) * pageSize;
  q = q.order('created_at', { ascending: false }).range(from, from + pageSize - 1);

  const { data: drivers, error, count } = await q;
  if (error) throw error;

  const ids = (drivers ?? []).map((d) => d.id);
  const counts = {};
  const lastDate = {};
  if (ids.length) {
    const { data: bk, error: bErr } = await supabaseAdmin
      .from('bookings')
      .select('driver_id, booking_date')
      .is('deleted_at', null)
      .in('driver_id', ids);
    if (bErr) throw bErr;
    for (const r of bk) {
      counts[r.driver_id] = (counts[r.driver_id] ?? 0) + 1;
      if (!lastDate[r.driver_id] || r.booking_date > lastDate[r.driver_id]) {
        lastDate[r.driver_id] = r.booking_date;
      }
    }
  }

  return {
    drivers: (drivers ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email,
      isVerified: d.is_verified,
      suspendedAt: d.suspended_at ?? null,
      createdAt: d.created_at,
      bookingsCount: counts[d.id] ?? 0,
      lastBookingDate: lastDate[d.id] ?? null,
    })),
    pagination: { total: count ?? 0, page, pageSize },
  };
}

// ── 單一司機 ─────────────────────────
export async function getDriverDetail(driverId) {
  const { data: driver, error } = await supabaseAdmin
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .maybeSingle();
  if (error) throw error;
  if (!driver) throw ApiError.notFound('找不到司機');

  const { data: bookings, error: bErr } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('driver_id', driverId)
    .is('deleted_at', null)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .limit(20);
  if (bErr) throw bErr;

  const stats = await getDriverStats(driverId, currentMonth());

  return {
    driver: driverPrivate(driver),
    stats,
    recentBookings: (bookings ?? []).map(bookingItem),
  };
}

// ── 全站預約 ─────────────────────────
export async function listAllBookings({ status, driverId, month, page = 1, pageSize = 20 }) {
  let q = supabaseAdmin
    .from('bookings')
    .select('*, drivers!bookings_driver_id_fkey(name)', { count: 'exact' })
    .is('deleted_at', null);

  if (status) q = q.eq('status', status);
  if (driverId) q = q.eq('driver_id', driverId);
  if (month) {
    const { start, endExclusive } = monthRange(month);
    q = q.gte('booking_date', start).lt('booking_date', endExclusive);
  }

  const from = (page - 1) * pageSize;
  q = q
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .range(from, from + pageSize - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    bookings: (data ?? []).map((r) => ({ ...bookingItem(r), driverName: r.drivers?.name ?? null })),
    pagination: { total: count ?? 0, page, pageSize },
  };
}

// ── 信任驗證審核 ─────────────────────
export async function listPendingVerifications() {
  const { data, error } = await supabaseAdmin
    .from('driver_verifications')
    .select('id, driver_id, kind, file_path, submitted_data, created_at, drivers(name, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    driverId: r.driver_id,
    driverName: r.drivers?.name ?? null,
    driverPhone: r.drivers?.phone ?? null,
    kind: r.kind,
    fileUrl: r.file_path ? avatarPublicUrl(r.file_path) : null, // photo 存在公開 bucket
    submittedData: r.submitted_data ?? null,
    createdAt: r.created_at,
  }));
}

export async function reviewVerification(id, { action, note }, actorEmail) {
  const { data: row, error } = await supabaseAdmin
    .from('driver_verifications')
    .select('id, driver_id, kind, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw ApiError.notFound('找不到這筆驗證');
  if (row.status !== 'pending') throw ApiError.conflict('這筆驗證已經審核過了');

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error: uErr } = await supabaseAdmin
    .from('driver_verifications')
    .update({
      status,
      note: note ?? null,
      reviewed_by: actorEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (uErr) throw uErr;

  const trust = await recomputeTrust(row.driver_id);
  await logAdminAction(actorEmail, `verification_${status}`, 'driver_verification', id, {
    driverId: row.driver_id,
    kind: row.kind,
    note: note ?? null,
  });

  return { id, status, ...trust };
}

// ── 動作 ────────────────────────────
export async function setDriverVerified(driverId, verified, actorEmail) {
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .update({ is_verified: verified })
    .eq('id', driverId)
    .select('id, is_verified')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound('找不到司機');
  await logAdminAction(actorEmail, verified ? 'verify' : 'unverify', 'driver', driverId, null);
  return data;
}

export async function setDriverSuspended(driverId, suspended, reason, actorEmail) {
  const { data, error } = await supabaseAdmin
    .from('drivers')
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq('id', driverId)
    .select('id, suspended_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound('找不到司機');
  await logAdminAction(
    actorEmail,
    suspended ? 'suspend' : 'unsuspend',
    'driver',
    driverId,
    reason ? { reason } : null,
  );
  return { id: data.id, suspendedAt: data.suspended_at ?? null };
}
