// 預約狀態查詢用的無狀態 token：HMAC(bookingId, JWT_SECRET)。
// 不需額外資料表，客人拿 { bookingId, token } 即可查自己的預約。
import crypto from 'crypto';
import { config } from '../config/index.js';

export function makeBookingToken(bookingId) {
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`booking:${bookingId}`)
    .digest('hex')
    .slice(0, 32);
}

export function verifyBookingToken(bookingId, token) {
  if (!token) return false;
  const expected = makeBookingToken(bookingId);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
