-- ============================================================
-- RideHub — 補開後續新增資料表的 Row Level Security
-- ============================================================
-- 20260827000002 之後陸續加了 fuel_prices / distance_cache / admin_actions，
-- 這三張表當時沒有 enable RLS。後端一律用 service_role（會繞過 RLS），
-- 這裡「enable RLS 且不建任何 policy」= 前端 anon / authenticated 完全讀不到，
-- 與 notifications_log 的處理方式一致。
-- ============================================================

alter table fuel_prices    enable row level security;
alter table distance_cache enable row level security;
alter table admin_actions  enable row level security;
