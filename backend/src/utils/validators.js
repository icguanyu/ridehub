// 共用的 zod 欄位驗證片段。
import { z } from 'zod';

// 台灣手機：09 開頭共 10 碼
export const phoneField = z
  .string()
  .trim()
  .regex(/^09\d{8}$/, '手機格式需為 09xxxxxxxx');

export const passwordField = z.string().min(8, '密碼至少 8 碼').max(72);

export const nameField = z.string().trim().min(1).max(100);

export const emailField = z.string().trim().email('email 格式錯誤').max(100);

// "HH:MM" 24 小時制
export const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '時間格式需為 HH:MM');

// "YYYY-MM-DD"
export const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式需為 YYYY-MM-DD');
