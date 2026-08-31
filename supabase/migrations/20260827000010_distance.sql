-- ============================================================
-- RideHub — 依上車/目的地文字自動估算開車距離（Google Distance Matrix）
-- ============================================================

alter table bookings
  add column if not exists estimated_duration_min int;

-- 距離查詢快取：key = normalize(origin) || '||' || normalize(destination)
-- distance_km 為 null 代表 Google 查不到（負快取），避免重複打 API
create table if not exists distance_cache (
  key text primary key,
  distance_km numeric(7, 2),
  duration_min int,
  created_at timestamptz not null default now()
);
