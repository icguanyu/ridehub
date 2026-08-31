// 通知調度：只走 LINE 推播（給司機）。客人不推播，改由狀態頁 / 手機查詢查看。
// 全程寫入 notifications_log；任何通知失敗都不得中斷主要 API 流程。
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { pushText, newBookingText, quoteRespondedText } from './lineService.js';

async function logNotification(entry) {
  const { error } = await supabaseAdmin.from('notifications_log').insert(entry);
  if (error) logger.error('寫入 notifications_log 失敗', error.message);
}

// 透過 LINE 推播。回傳 { channel, ok, skipped?, error? }
async function deliver({ lineId, text }) {
  if (!lineId) return { channel: 'none', ok: false, skipped: true };
  try {
    const r = await pushText(lineId, text);
    if (r.ok) return { channel: 'line', ok: true };
    return { channel: 'none', ok: false, skipped: true }; // LINE 未設定
  } catch (err) {
    logger.warn('LINE 推播失敗', err.message);
    return { channel: 'line', ok: false, error: err.message };
  }
}

const logStatus = (r) => (r.ok ? 'sent' : r.skipped ? 'skipped' : 'failed');

// 新預約 → 通知司機
export async function notifyDriverNewBooking(driver, booking) {
  const result = await deliver({ lineId: driver.line_id, text: newBookingText(booking) });
  await logNotification({
    booking_id: booking.id,
    recipient_line_id: driver.line_id ?? null,
    recipient_type: 'driver',
    notification_type: 'new_booking',
    status: logStatus(result),
    error_message: result.error ?? null,
  });
  return result;
}

// 客人回應報價 → 通知司機
export async function notifyDriverQuoteResponse(booking, driver, { accepted }) {
  const result = await deliver({
    lineId: driver.line_id,
    text: quoteRespondedText(booking, accepted),
  });
  await logNotification({
    booking_id: booking.id,
    recipient_line_id: driver.line_id ?? null,
    recipient_type: 'driver',
    notification_type: accepted ? 'quote_accepted' : 'quote_declined',
    status: logStatus(result),
    error_message: result.error ?? null,
  });
  return result;
}
