import { createClient } from '@supabase/supabase-js';

// 前端只在「忘記密碼 / 重設密碼」用到 Supabase Auth。
// 其他資料一律走後端 API。
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

// implicit flow：recovery 連結會把 token 放在 URL hash，
// detectSessionInUrl 會自動解析成一個暫時 session 供 updateUser 使用。
// persistSession: false → 不寫進 localStorage，重設完就沒了。
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
