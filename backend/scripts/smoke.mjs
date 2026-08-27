/**
 * RideHub E2E 煙霧測試
 *
 * 需求：
 *   1. 後端執行中（預設 http://localhost:3000）
 *   2. 環境變數 SUPABASE_URL / SUPABASE_SERVICE_KEY（用於測試後清理資料）
 *      — 直接用 backend/.env：  npm run smoke  (from backend/)
 *
 * 用法：
 *   npm run smoke  (from backend/)
 *   API_BASE=http://localhost:3000/api/v1 npm run smoke  (from backend/)
 */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Node 20 沒有內建 WebSocket，補上 polyfill（同 backend/src/config/supabase.js）
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const API = process.env.API_BASE || 'http://localhost:3000/api/v1';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let pass = 0;
let fail = 0;
const results = [];

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    results.push(`  ✅ ${name}`);
  } else {
    fail++;
    results.push(`  ❌ ${name}${extra ? `  — ${extra}` : ''}`);
  }
}

async function req(method, path, { body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, body: json };
}

const rand = Math.floor(Math.random() * 1e6);
const phone = `09${String(rand).padStart(8, '0')}`.slice(0, 10);
const email = `smoke_${rand}@ridehub.test`;
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
const day3 = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

let driverId;
let driverToken;
let userId;

async function run() {
  console.log(`\n▶ RideHub 煙霧測試  (${API})\n`);

  // ── 健康檢查 ──
  const health = await req('GET', '/health');
  check('健康檢查回 200', health.status === 200);
  const db = await req('GET', '/health/db');
  check('Supabase 連線正常', db.status === 200 && db.body?.ok === true);

  // ── 註冊 / 登入 ──
  const reg = await req('POST', '/drivers/auth/register', {
    body: { name: '煙霧司機', phone, email, password: 'smoke12345' },
  });
  check('司機註冊 201', reg.status === 201, `got ${reg.status}`);
  driverId = reg.body?.driver?.id;
  driverToken = reg.body?.token;
  check('註冊回傳 driver.id 與 token', Boolean(driverId && driverToken));

  const dup = await req('POST', '/drivers/auth/register', {
    body: { name: 'x', phone, email: `x_${rand}@ridehub.test`, password: 'smoke12345' },
  });
  check('重複手機註冊回 409', dup.status === 409);

  const badLogin = await req('POST', '/drivers/auth/login', {
    body: { phone, password: 'wrong-pass' },
  });
  check('錯誤密碼登入回 401', badLogin.status === 401);

  const login = await req('POST', '/drivers/auth/login', {
    body: { phone, password: 'smoke12345' },
  });
  check('正確登入 200 + token', login.status === 200 && Boolean(login.body?.token));
  driverToken = login.body?.token || driverToken;

  // ── 司機設定 ──
  const prof = await req('PUT', `/drivers/${driverId}`, {
    token: driverToken,
    body: { basePrice: 250, pricePerKm: 20, carType: '轎車', serviceAreas: '新竹市' },
  });
  check('更新服務資訊 200', prof.status === 200 && prof.body?.basePrice === 250);

  const badField = await req('PUT', `/drivers/${driverId}`, {
    token: driverToken,
    body: { phone: '0900000000' },
  });
  check('更新非白名單欄位回 400', badField.status === 400);

  const avail = await req('PUT', `/drivers/${driverId}/availability`, {
    token: driverToken,
    body: { operatingHoursStart: '08:00', operatingHoursEnd: '20:00', maxDailyBookings: 2 },
  });
  check('設定營運時間 200', avail.status === 200 && avail.body?.maxDailyBookings === 2);

  const bindLine = await req('POST', `/drivers/${driverId}/bind-line`, {
    token: driverToken,
    body: { lineId: 'Usmoketestlineid0000000000000000' },
  });
  check('綁定 LINE 200', bindLine.status === 200);

  const noAuth = await req('GET', `/drivers/${driverId}`);
  check('未帶 token 存取回 401', noAuth.status === 401);

  const otherId = await req('GET', '/drivers/00000000-0000-0000-0000-000000000000', {
    token: driverToken,
  });
  check('存取他人 driverId 回 403', otherId.status === 403);

  // ── 公開端點 ──
  const pub = await req('GET', `/drivers/${driverId}/public`);
  check('公開司機端點 200（免登入）', pub.status === 200 && pub.body?.name === '煙霧司機');
  check('公開端點不外洩電話', pub.body && !('phone' in pub.body));

  // ── 客人預約 ──
  const past = await req('POST', '/bookings', {
    body: baseBooking({ bookingDate: yesterday }),
  });
  check('預約過去日期回 400', past.status === 400);

  const outside = await req('POST', '/bookings', {
    body: baseBooking({ bookingTime: '06:00' }),
  });
  check('營運時間外預約回 400', outside.status === 400);

  const b1 = await req('POST', '/bookings', {
    body: baseBooking({ estimatedDistanceKm: 10 }),
  });
  check('建立預約 201', b1.status === 201, `got ${b1.status}`);
  check('預估車資 = 250 + 20×10 = 450', b1.body?.booking?.estimatedPrice === 450, `got ${b1.body?.booking?.estimatedPrice}`);
  const bookingId = b1.body?.booking?.id;
  const statusToken = b1.body?.booking?.statusToken;
  check('回傳 statusToken', Boolean(statusToken));

  const b2 = await req('POST', '/bookings', { body: baseBooking({ bookingTime: '15:00' }) });
  check('第 2 筆預約 201', b2.status === 201);
  const b3 = await req('POST', '/bookings', { body: baseBooking({ bookingTime: '16:00' }) });
  check('第 3 筆預約回 409（當日額滿，上限 2）', b3.status === 409);

  const badToken = await req('GET', `/bookings/${bookingId}?token=deadbeef`);
  check('錯誤 token 查詢回 403', badToken.status === 403);

  const status1 = await req('GET', `/bookings/${bookingId}?token=${statusToken}`);
  check('正確 token 查詢 200 / 狀態 pending', status1.status === 200 && status1.body?.booking?.status === 'pending');
  check('pending 時不揭露司機電話', status1.body?.booking?.driverPhone === null);

  // ── 司機看預約 ──
  const list = await req('GET', `/drivers/${driverId}/bookings?status=pending`, { token: driverToken });
  check('司機預約列表含 2 筆 pending（第 3 筆因額滿未建立）', list.body?.pagination?.total === 2, `got ${list.body?.pagination?.total}`);

  // ── 接受 / 拒絕 ──
  const accept = await req('PUT', `/bookings/${bookingId}/accept`, { token: driverToken });
  check('司機接受預約 200', accept.status === 200 && accept.body?.booking?.status === 'accepted');

  const acceptAgain = await req('PUT', `/bookings/${bookingId}/accept`, { token: driverToken });
  check('重複接受回 409', acceptAgain.status === 409);

  const status2 = await req('GET', `/bookings/${bookingId}?token=${statusToken}`);
  check('accepted 後揭露司機電話', status2.body?.booking?.driverPhone === phone);

  const reject = await req('PUT', `/bookings/${b2.body.booking.id}/reject`, {
    token: driverToken,
    body: { reason: '時間衝突' },
  });
  check('司機拒絕預約 200 + reason', reject.status === 200 && reject.body?.booking?.rejectedReason === '時間衝突');

  const foreignAccept = await req('PUT', `/bookings/${b3.body?.booking?.id || bookingId}/accept`);
  check('未登入接受回 401', foreignAccept.status === 401);

  // ── 統計 ──
  const stats = await req('GET', `/drivers/${driverId}/stats?month=${tomorrow.slice(0, 7)}`, {
    token: driverToken,
  });
  check('統計：本月接單 2', stats.body?.totalBookings === 2, `got ${stats.body?.totalBookings}`);
  check('統計：成交 1（僅 accepted）', stats.body?.acceptedBookings === 1, `got ${stats.body?.acceptedBookings}`);
  check('統計：收入 450', stats.body?.totalRevenue === 450, `got ${stats.body?.totalRevenue}`);

  // ── 往返行程 ──
  const rtMissing = await req('POST', '/bookings', {
    body: baseBooking({ bookingDate: dayAfter, tripType: 'round_trip' }),
  });
  check('往返未填回程回 400', rtMissing.status === 400);

  const rtBadDate = await req('POST', '/bookings', {
    body: baseBooking({
      bookingDate: dayAfter,
      tripType: 'round_trip',
      returnDate: tomorrow,
      returnTime: '18:00',
    }),
  });
  check('回程早於去程回 400', rtBadDate.status === 400);

  const rt = await req('POST', '/bookings', {
    body: baseBooking({
      bookingDate: dayAfter,
      bookingTime: '09:00',
      tripType: 'round_trip',
      returnDate: dayAfter,
      returnTime: '18:00',
      estimatedDistanceKm: 10,
    }),
  });
  check('建立往返預約 201', rt.status === 201, `got ${rt.status}`);
  check('往返車資 = (250 + 20×10) × 2 = 900', rt.body?.booking?.estimatedPrice === 900, `got ${rt.body?.booking?.estimatedPrice}`);
  check('回傳 tripType = round_trip', rt.body?.booking?.tripType === 'round_trip');

  const rtStatus = await req('GET', `/bookings/${rt.body.booking.id}?token=${rt.body.booking.statusToken}`);
  check('往返查詢帶回 returnDate / returnTime', rtStatus.body?.booking?.returnDate === dayAfter && rtStatus.body?.booking?.returnTime === '18:00');

  // ── 司機重新報價 → 客人回應 ──
  const bq = await req('POST', '/bookings', { body: baseBooking({ bookingDate: day3, bookingTime: '10:00' }) });
  const bqId = bq.body.booking.id;
  const bqToken = bq.body.booking.statusToken;

  const quote = await req('PUT', `/bookings/${bqId}/quote`, {
    token: driverToken,
    body: { price: 777, note: '含等候一小時' },
  });
  check('司機重新報價 200 / 狀態 quoted', quote.status === 200 && quote.body?.booking?.status === 'quoted', `got ${quote.status}`);
  check('報價金額寫入 quotedPrice', quote.body?.booking?.quotedPrice === 777);

  const quoteAgain = await req('PUT', `/bookings/${bqId}/quote`, { token: driverToken, body: { price: 800 } });
  check('已報價後再報價回 409', quoteAgain.status === 409);

  const qStatus = await req('GET', `/bookings/${bqId}?token=${bqToken}`);
  check('客人查詢看到 quoted + 報價 + 說明', qStatus.body?.booking?.status === 'quoted' && qStatus.body?.booking?.quotedPrice === 777 && qStatus.body?.booking?.quoteNote === '含等候一小時');

  const qBadToken = await req('PUT', `/bookings/${bqId}/quote/accept?token=nope`);
  check('客人回應報價錯 token 回 403', qBadToken.status === 403);

  const qAccept = await req('PUT', `/bookings/${bqId}/quote/accept?token=${bqToken}`);
  check('客人同意報價 200 / 狀態 accepted', qAccept.status === 200 && qAccept.body?.booking?.status === 'accepted', `got ${qAccept.status}`);
  check('成交價 agreedPrice = 777', qAccept.body?.booking?.agreedPrice === 777, `got ${qAccept.body?.booking?.agreedPrice}`);
  check('同意後揭露司機電話', qAccept.body?.booking?.driverPhone === phone);

  const qAcceptAgain = await req('PUT', `/bookings/${bqId}/quote/accept?token=${bqToken}`);
  check('非 quoted 狀態回應報價回 409', qAcceptAgain.status === 409);

  // decline 路徑
  const bq2 = await req('POST', '/bookings', { body: baseBooking({ bookingDate: day3, bookingTime: '11:00' }) });
  await req('PUT', `/bookings/${bq2.body.booking.id}/quote`, { token: driverToken, body: { price: 999 } });
  const qDecline = await req('PUT', `/bookings/${bq2.body.booking.id}/quote/decline?token=${bq2.body.booking.statusToken}`);
  check('客人不同意報價 200 / 狀態 cancelled', qDecline.status === 200 && qDecline.body?.booking?.status === 'cancelled', `got ${qDecline.status}`);

  // ── 統計（含往返與報價成交）──
  const stats2 = await req('GET', `/drivers/${driverId}/stats?month=${tomorrow.slice(0, 7)}`, { token: driverToken });
  check('統計2：成交 2（accept + quote-accept）', stats2.body?.acceptedBookings === 2, `got ${stats2.body?.acceptedBookings}`);
  check('統計2：收入 450 + 777 = 1227', stats2.body?.totalRevenue === 1227, `got ${stats2.body?.totalRevenue}`);

  // ── LINE 綁定碼 + webhook（需 migration 0004 + LINE_CHANNEL_SECRET）──
  const codeRes = await req('POST', `/drivers/${driverId}/line/link-code`, { token: driverToken });
  if (codeRes.status === 200 && process.env.LINE_CHANNEL_SECRET) {
    check('產生綁定碼 200 / 6 碼', /^[A-Z2-9]{6}$/.test(codeRes.body?.code || ''), `got ${codeRes.body?.code}`);

    const fakeUser = 'Usmoketestwebhook00000000000000';
    const evt = JSON.stringify({
      events: [
        {
          type: 'message',
          replyToken: '00000000000000000000000000000000',
          source: { type: 'user', userId: fakeUser },
          message: { type: 'text', text: codeRes.body.code },
        },
      ],
    });
    const sig = crypto.createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(evt).digest('base64');
    const wh = await fetch(`${API}/line/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-line-signature': sig },
      body: evt,
    });
    check('webhook 正確簽章回 200', wh.status === 200, `got ${wh.status}`);

    const whBad = await fetch(`${API}/line/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-line-signature': 'bad' },
      body: evt,
    });
    check('webhook 錯誤簽章回 401', whBad.status === 401);

    await new Promise((r) => setTimeout(r, 1200)); // 等事件非同步處理
    const after = await req('GET', `/drivers/${driverId}`, { token: driverToken });
    check('webhook 依綁定碼綁定 line_id', after.body?.lineId === fakeUser, `got ${after.body?.lineId}`);
  } else {
    results.push('  ⏭  LINE 綁定碼 / webhook 測試略過（需 migration 0004 + LINE_CHANNEL_SECRET）');
  }

  function baseBooking(over = {}) {
    return {
      driverId,
      customerName: '煙霧客人',
      customerPhone: '0987000111',
      pickupLocation: '新竹站',
      destination: '竹科',
      bookingDate: tomorrow,
      bookingTime: '14:00',
      passengerCount: 1,
      ...over,
    };
  }
}

async function cleanup() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('\n⚠ 未提供 SUPABASE_URL / SUPABASE_SERVICE_KEY，略過資料清理');
    console.log(`  請手動刪除測試司機 phone=${phone}`);
    return;
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data: d } = await sb.from('drivers').select('id,user_id').eq('phone', phone).maybeSingle();
  if (d) {
    await sb.from('bookings').delete().eq('driver_id', d.id);
    await sb.from('drivers').delete().eq('id', d.id);
    if (d.user_id) await sb.auth.admin.deleteUser(d.user_id).catch(() => {});
  }
  await sb
    .from('notifications_log')
    .delete()
    .like('recipient_line_id', 'Usmoketest%')
    .then(() => {});
  console.log('\n🧹 測試資料已清理');
}

try {
  await run();
} catch (err) {
  fail++;
  results.push(`  ❌ 測試中斷：${err.message}`);
} finally {
  await cleanup().catch((e) => console.log('清理失敗：', e.message));
}

console.log('\n' + results.join('\n'));
console.log(`\n結果：${pass} 通過, ${fail} 失敗\n`);
process.exit(fail === 0 ? 0 : 1);
