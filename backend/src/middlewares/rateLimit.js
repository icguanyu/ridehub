// 流量限制。IP 為準；正式環境經反向代理時記得 app.set('trust proxy', 1)。
import rateLimit from 'express-rate-limit';

const handler = (_req, res) => {
  res.status(429).json({ error: { message: '請求過於頻繁，請稍後再試' } });
};

const base = { standardHeaders: true, legacyHeaders: false, handler };

// 全站 API 保底上限（擋爬蟲 / 暴衝），對正常使用者寬鬆
export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 1000 });

// 乘客手機查詢：防止用號碼枚舉他人行程
export const searchLimiter = rateLimit({ ...base, windowMs: 10 * 60 * 1000, limit: 20 });

// 登入 / 註冊：防暴力破解
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 10 });

// 匿名建立預約：防灌單
export const createBookingLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 20 });
