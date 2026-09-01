import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { signDriverToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

// 司機註冊：於 Supabase Auth 建帳號 → 建立 drivers 資料列
export async function registerDriver({ name, phone, email, password }) {
  // 1. 手機不可重複
  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('drivers')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  if (existing) throw ApiError.conflict('此手機號碼已註冊');

  // 2. 建立 Auth 使用者
  // 只用 email 認證；手機僅存在 drivers 表，登入時以手機反查 email。
  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone },
  });
  if (authErr) {
    if (/already been registered|already exists/i.test(authErr.message)) {
      throw ApiError.conflict('此 email 已註冊');
    }
    throw authErr;
  }
  const userId = created.user.id;

  // 3. 建立 driver 資料列；失敗則回滾 Auth 使用者
  const { data: driver, error: insertErr } = await supabaseAdmin
    .from('drivers')
    .insert({ user_id: userId, name, phone, email })
    .select('*')
    .single();

  if (insertErr) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch((e) =>
      logger.error('回滾 Auth 使用者失敗', e),
    );
    if (insertErr.code === '23505') throw ApiError.conflict('手機或 email 已註冊');
    throw insertErr;
  }

  const token = signDriverToken(driver.id, userId);
  return { driver, token };
}

// 司機登入：手機 → email → Supabase 驗證密碼
export async function loginDriver({ phone, password }) {
  const { data: driver, error } = await supabaseAdmin
    .from('drivers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) throw error;
  if (!driver || !driver.email) throw ApiError.unauthorized('手機或密碼錯誤');
  if (driver.suspended_at) throw ApiError.forbidden('此帳號已停權，請聯絡平台');

  const { data: session, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: driver.email,
    password,
  });
  if (signInErr || !session?.session) throw ApiError.unauthorized('手機或密碼錯誤');

  const token = signDriverToken(driver.id, driver.user_id);
  return {
    driver,
    token,
    supabase: {
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
      expiresAt: session.session.expires_at,
    },
  };
}
