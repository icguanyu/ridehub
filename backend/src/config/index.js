// 讀取並驗證環境變數。缺少必要變數時直接讓程式啟動失敗。
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // 營運時區（IANA 名稱，例如 Asia/Taipei、Europe/Berlin）。
  // 所有「今天 / 現在」的判斷都以此時區為準；用具名時區才能正確處理日光節約。
  APP_TIMEZONE: z
    .string()
    .default('Asia/Taipei')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-CA', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, '無效的 IANA 時區名稱'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET 至少 16 字元'),
  JWT_EXPIRY: z.string().default('7d'),

  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional().default(''),
  LINE_CHANNEL_SECRET: z.string().optional().default(''),
  LINE_ADD_FRIEND_URL: z.string().optional().default(''), // 官方帳號加好友連結（lin.ee / line.me）

  SENDGRID_API_KEY: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ 環境變數設定錯誤：');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  apiBaseUrl: env.API_BASE_URL,
  timezone: env.APP_TIMEZONE,
  corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiry: env.JWT_EXPIRY,
  },

  line: {
    accessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: env.LINE_CHANNEL_SECRET,
    addFriendUrl: env.LINE_ADD_FRIEND_URL,
    get enabled() {
      return Boolean(env.LINE_CHANNEL_ACCESS_TOKEN);
    },
    get webhookEnabled() {
      return Boolean(env.LINE_CHANNEL_SECRET);
    },
  },

  sendgrid: {
    apiKey: env.SENDGRID_API_KEY,
    get enabled() {
      return Boolean(env.SENDGRID_API_KEY);
    },
  },
};
