// LINE Messaging API — push message。
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

async function callLine(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.line.accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LINE API ${res.status}: ${body}`);
  }
  return { ok: true };
}

// 主動推播。回傳 { skipped } 或 { ok } ；失敗則 throw。
export async function pushText(toLineId, text) {
  if (!config.line.enabled) {
    logger.warn('LINE 未設定，略過推播');
    return { skipped: true };
  }
  if (!toLineId) return { skipped: true };
  return callLine(PUSH_URL, { to: toLineId, messages: [{ type: 'text', text }] });
}

// 回覆 webhook 事件（用 replyToken，免費且不計入推播額度）
export async function replyText(replyToken, text) {
  if (!config.line.enabled || !replyToken) return { skipped: true };
  return callLine(REPLY_URL, { replyToken, messages: [{ type: 'text', text }] });
}

// ── 訊息樣板 ─────────────────────────
const hm = (t) => String(t).slice(0, 5);

function tripLines(b) {
  const lines = [
    `行程：${b.trip_type === 'round_trip' ? '往返' : '單程'}`,
    `去程：${b.booking_date} ${hm(b.booking_time)}  ${b.pickup_location} → ${b.destination}`,
  ];
  if (b.trip_type === 'round_trip') {
    lines.push(`回程：${b.return_date} ${hm(b.return_time)}  ${b.destination} → ${b.pickup_location}`);
  }
  return lines;
}

export function newBookingText(b) {
  return [
    '📋 新預約',
    `客人：${b.customer_name}（${b.customer_phone}）`,
    ...tripLines(b),
    `人數：${b.passenger_count} 人`,
    b.special_requests ? `備註：${b.special_requests}` : null,
    `預估：NT$${b.estimated_price ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function acceptedText(driver, b) {
  const price = b.quoted_price ?? b.estimated_price ?? 0;
  return [
    '✅ 司機已接受您的預約',
    `司機：${driver.name}`,
    `電話：${driver.phone}`,
    driver.line_id ? `LINE：${driver.line_id}` : null,
    ...tripLines(b),
    `車資：NT$${price}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function rejectedText(driver, b, reason) {
  return [
    '❌ 很抱歉，司機無法接受這筆預約',
    `司機：${driver.name}`,
    reason ? `原因：${reason}` : null,
    `原預約：${b.booking_date} ${hm(b.booking_time)} ${b.pickup_location} → ${b.destination}`,
    '請另尋其他時段或司機，謝謝。',
  ]
    .filter(Boolean)
    .join('\n');
}

// 司機取消已成立的預約 → 通知客人
export function cancelledText(driver, b, reason) {
  return [
    '⚠️ 司機已取消這筆預約',
    `司機：${driver.name}`,
    reason ? `取消原因：${reason}` : null,
    ...tripLines(b),
    '造成不便敬請見諒，可另尋其他時段或司機。',
  ]
    .filter(Boolean)
    .join('\n');
}

// 司機重新報價 → 通知客人
export function quotedText(driver, b) {
  return [
    '💬 司機提出新報價',
    `司機：${driver.name}`,
    `原預估：NT$${b.estimated_price ?? 0}`,
    `新報價：NT$${b.quoted_price}`,
    b.quote_note ? `司機留言：${b.quote_note}` : null,
    '請到預約狀態頁確認是否接受此報價。',
  ]
    .filter(Boolean)
    .join('\n');
}

// 客人回應報價 → 通知司機
export function quoteRespondedText(b, accepted) {
  return [
    accepted ? '✅ 客人已同意您的報價' : '❌ 客人不同意報價，預約已取消',
    `客人：${b.customer_name}（${b.customer_phone}）`,
    ...tripLines(b),
    accepted ? `成交車資：NT$${b.quoted_price ?? b.estimated_price}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
