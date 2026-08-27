// 通知調度：優先 LINE，失敗或沒有 LINE ID 則改用簡訊，全程寫入 notifications_log。
// 任何通知失敗都不得中斷主要 API 流程。
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { pushText, newBookingText, acceptedText, rejectedText } from './lineService.js';
import { sendSMS } from './smsService.js';

async function logNotification(entry) {
  const { error } = await supabaseAdmin.from('notifications_log').insert(entry);
  if (error) logger.error('寫入 notifications_log 失敗', error.message);
}

// 嘗試 LINE → 失敗改簡訊。回傳 { channel, ok, skipped?, error? }
async function deliver({ lineId, phone, text }) {
  let anyAttempt = false;

  if (lineId) {
    try {
      const r = await pushText(lineId, text);
      if (r.ok) return { channel: 'line', ok: true };
      // r.skipped === true → LINE 未設定，往下嘗試簡訊
    } catch (err) {
      anyAttempt = true;
      logger.warn('LINE 推播失敗，改用簡訊', err.message);
    }
  }
  if (phone) {
    try {
      const r = await sendSMS(phone, text);
      if (r.ok) return { channel: 'sms', ok: true };
    } catch (err) {
      anyAttempt = true;
      logger.warn('簡訊發送失敗', err.message);
      return { channel: 'sms', ok: false, error: err.message };
    }
  }
  // 兩個管道都沒送出：可能是都沒設定（skipped），或都沒有收件資訊
  return { channel: 'none', ok: false, skipped: !anyAttempt };
}

const logStatus = (r) => (r.ok ? 'sent' : r.skipped ? 'skipped' : 'failed');

// 新預約 → 通知司機
export async function notifyDriverNewBooking(driver, booking) {
  const result = await deliver({
    lineId: driver.line_id,
    phone: driver.phone,
    text: newBookingText(booking),
  });
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

// 司機接受 / 拒絕 → 通知客人
export async function notifyCustomerBookingResult(booking, driver, { accepted, reason }) {
  const text = accepted ? acceptedText(driver, booking) : rejectedText(driver, booking, reason);
  const result = await deliver({
    lineId: booking.customer_line_id,
    phone: booking.customer_phone,
    text,
  });
  await logNotification({
    booking_id: booking.id,
    recipient_line_id: booking.customer_line_id ?? null,
    recipient_type: 'customer',
    notification_type: accepted ? 'booking_accepted' : 'booking_rejected',
    status: logStatus(result),
    error_message: result.error ?? null,
  });
  return result;
}
