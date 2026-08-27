// Supabase client。
// - admin：使用 service_role key，繞過 RLS，供後端所有資料操作使用。
// - anon ：使用 anon key，需要時用來驗證司機的 Supabase Auth token。
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from './index.js';

// Node 20 沒有內建 WebSocket，補上 polyfill 讓 supabase-js 的 realtime 模組能初始化。
// （Node 22+ 內建，可移除。）
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const noPersist = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  noPersist,
);

export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  noPersist,
);
