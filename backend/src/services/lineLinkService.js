import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的 I O 0 1
const CODE_LENGTH = 6;
const TTL_MINUTES = 30;

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return s;
}

// 司機產生綁定碼（覆蓋舊碼）
export async function generateLinkCode(driverId) {
  const code = randomCode();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();

  const { error } = await supabaseAdmin
    .from('drivers')
    .update({ line_link_code: code, line_link_code_expires_at: expiresAt })
    .eq('id', driverId);
  if (error) throw error;

  return { code, expiresAt, ttlMinutes: TTL_MINUTES };
}

// webhook 收到文字 → 嘗試用綁定碼把 line_id 綁到司機。
// 回傳綁定成功的 driver，或 null。
export async function bindByLinkCode(rawText, lineUserId) {
  if (!lineUserId) return null;
  const code = String(rawText || '').trim().toUpperCase();
  if (code.length !== CODE_LENGTH) return null;

  const { data: driver, error } = await supabaseAdmin
    .from('drivers')
    .select('id, name, line_link_code_expires_at')
    .eq('line_link_code', code)
    .maybeSingle();
  if (error) throw error;
  if (!driver) return null;

  if (
    !driver.line_link_code_expires_at ||
    new Date(driver.line_link_code_expires_at).getTime() < Date.now()
  ) {
    throw ApiError.badRequest('綁定碼已過期，請重新產生');
  }

  const { error: updErr } = await supabaseAdmin
    .from('drivers')
    .update({ line_id: lineUserId, line_link_code: null, line_link_code_expires_at: null })
    .eq('id', driver.id);
  if (updErr) throw updErr;

  return driver;
}
