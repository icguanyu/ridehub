# Supabase 設定

## 套用 Schema

到 Supabase 專案 → **SQL Editor** → New query，依序貼上並執行：

1. `migrations/20260827000001_init_schema.sql` — 建立 5 張表、索引、trigger
2. `migrations/20260827000002_rls_policies.sql` — 啟用 RLS 與 policy

（未來若安裝 Supabase CLI，可改用 `supabase db push`。）

## 手動設定（Dashboard）

| 項目 | 位置 | 設定 |
|------|------|------|
| Email 登入 | Authentication → Providers → Email | 啟用 |
| Phone 登入 | Authentication → Providers → Phone | 啟用（MVP 可先略過，需接簡訊商）|
| Redirect URL | Authentication → URL Configuration | `http://localhost:5173/auth/callback`（本機開發）|
| Storage bucket | Storage → New bucket | `driver-photos`（Public）、`profile-uploads`（Private）|
| Realtime | Database → Replication | 開啟 `bookings` 表 |

## 需要記下的金鑰（Project Settings → API）

- `Project URL` → 後端 `SUPABASE_URL`、前端 `VITE_SUPABASE_URL`
- `anon public` key → 前端 `VITE_SUPABASE_ANON_KEY`
- `service_role` key → 後端 `SUPABASE_SERVICE_KEY`（**機密，絕不進前端 / git**）
