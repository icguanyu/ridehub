// 簡訊備援 — Twilio REST API。
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// 台灣門號 09xxxxxxxx → E.164 +8869xxxxxxxx
function toE164TW(phone) {
  const p = String(phone).trim();
  if (p.startsWith('+')) return p;
  if (p.startsWith('09')) return `+886${p.slice(1)}`;
  return p;
}

export async function sendSMS(toPhone, text) {
  if (!config.twilio.enabled) {
    logger.warn('Twilio 未設定，略過簡訊');
    return { skipped: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
  const form = new URLSearchParams({
    To: toE164TW(toPhone),
    From: config.twilio.phoneNumber,
    Body: text,
  });
  const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Twilio 失敗 ${res.status}: ${body}`);
  }
  return { ok: true };
}
