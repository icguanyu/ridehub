-- ============================================================
-- RideHub MVP v1.0 — Row Level Security
-- ============================================================
-- 設計原則：
--   * 後端 API 使用 service_role key，會「繞過」所有 RLS。
--   * 這裡的 policy 只保護「前端直連 Supabase（anon / authenticated key）」的情境，
--     例如司機端用 Supabase Auth 登入後直接讀自己的資料、訂閱 Realtime。
--   * 客人為匿名，不直接碰 Supabase，一律走後端，因此不開任何 anon 權限。
-- ============================================================

alter table drivers            enable row level security;
alter table bookings           enable row level security;
alter table booking_ratings    enable row level security;
alter table driver_stats       enable row level security;
alter table notifications_log  enable row level security;

-- ------------------------------------------------------------
-- drivers：司機只能讀 / 改自己的資料
-- ------------------------------------------------------------
drop policy if exists drivers_select_own on drivers;
create policy drivers_select_own on drivers
  for select
  using (auth.uid() = user_id);

drop policy if exists drivers_update_own on drivers;
create policy drivers_update_own on drivers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 註冊時把 user_id 綁到自己
drop policy if exists drivers_insert_self on drivers;
create policy drivers_insert_self on drivers
  for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- bookings：司機只能看自己名下的預約（Realtime 用）
-- ------------------------------------------------------------
drop policy if exists bookings_drivers_own on bookings;
create policy bookings_drivers_own on bookings
  for select
  using (
    driver_id in (select id from drivers where user_id = auth.uid())
  );

-- 司機可更新自己名下預約的狀態（接受 / 拒絕 / 完成）
drop policy if exists bookings_drivers_update_own on bookings;
create policy bookings_drivers_update_own on bookings
  for update
  using (
    driver_id in (select id from drivers where user_id = auth.uid())
  )
  with check (
    driver_id in (select id from drivers where user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- booking_ratings：司機可讀自己名下預約的評分
-- ------------------------------------------------------------
drop policy if exists ratings_drivers_read_own on booking_ratings;
create policy ratings_drivers_read_own on booking_ratings
  for select
  using (
    booking_id in (
      select b.id from bookings b
      join drivers d on d.id = b.driver_id
      where d.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- driver_stats：司機只能讀自己的統計
-- ------------------------------------------------------------
drop policy if exists stats_drivers_read_own on driver_stats;
create policy stats_drivers_read_own on driver_stats
  for select
  using (
    driver_id in (select id from drivers where user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- notifications_log：不對前端開放（僅後端 service_role）
-- 已 enable RLS 且無 policy = 前端完全讀不到
-- ------------------------------------------------------------
