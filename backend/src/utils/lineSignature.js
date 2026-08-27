import crypto from 'crypto';
import { config } from '../config/index.js';

// 驗證 LINE webhook 的 x-line-signature（HMAC-SHA256(rawBody, channelSecret) → base64）
export function verifyLineSignature(rawBody, signature) {
  if (!config.line.channelSecret || !signature || !rawBody) return false;
  const expected = crypto
    .createHmac('sha256', config.line.channelSecret)
    .update(rawBody)
    .digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
