// 讀取並驗證環境變數。缺少必要變數時直接讓程式啟動失敗。
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET 至少 16 字元'),
  JWT_EXPIRY: z.string().default('7d'),

  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional().default(''),
  LINE_CHANNEL_SECRET: z.string().optional().default(''),

  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_PHONE_NUMBER: z.string().optional().default(''),

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
    get enabled() {
      return Boolean(env.LINE_CHANNEL_ACCESS_TOKEN);
    },
  },

  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
    get enabled() {
      return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
    },
  },

  sendgrid: {
    apiKey: env.SENDGRID_API_KEY,
    get enabled() {
      return Boolean(env.SENDGRID_API_KEY);
    },
  },
};
