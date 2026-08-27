// LINE Messaging API — push message。
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const PUSH_URL = 'https://api.line.me/v2/bot/message/push';

// 回傳 { skipped } 或 { ok } ；失敗則 throw。
export async function pushText(toLineId, text) {
  if (!config.line.enabled) {
    logger.warn('LINE 未設定，略過推播');
    return { skipped: true };
  }
  if (!toLineId) return { skipped: true };

  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.line.accessToken}`,
    },
    body: JSON.stringify({ to: toLineId, messages: [{ type: 'text', text }] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LINE push 失敗 ${res.status}: ${body}`);
  }
  return { ok: true };
}

// ── 訊息樣板 ─────────────────────────
export function newBookingText(b) {
  return [
    '📋 新預約',
    `客人：${b.customer_name}（${b.customer_phone}）`,
    `時間：${b.booking_date} ${String(b.booking_time).slice(0, 5)}`,
    `上車：${b.pickup_location}`,
    `目的地：${b.destination}`,
    `人數：${b.passenger_count} 人`,
    b.special_requests ? `備註：${b.special_requests}` : null,
    `預估：NT$${b.estimated_price ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function acceptedText(driver, b) {
  return [
    '✅ 司機已接受您的預約',
    `司機：${driver.name}`,
    `電話：${driver.phone}`,
    driver.line_id ? `LINE：${driver.line_id}` : null,
    `時間：${b.booking_date} ${String(b.booking_time).slice(0, 5)}`,
    `上車：${b.pickup_location} → ${b.destination}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function rejectedText(driver, b, reason) {
  return [
    '❌ 很抱歉，司機無法接受這筆預約',
    `司機：${driver.name}`,
    reason ? `原因：${reason}` : null,
    `原預約：${b.booking_date} ${String(b.booking_time).slice(0, 5)} ${b.pickup_location} → ${b.destination}`,
    '請另尋其他時段或司機，謝謝。',
  ]
    .filter(Boolean)
    .join('\n');
}
