-- ============================================================
-- RideHub — 能耗成本估算（僅供參考）
-- 司機可選填油種/電、效率、每單位成本；
-- 建立預約時若有距離，快照一份能耗成本到 bookings。
-- ============================================================

alter table drivers
  add column if not exists energy_type text,
  add column if not exists energy_consumption numeric(6, 2),  -- 油車 km/L；電車 kWh/100km
  add column if not exists energy_unit_price numeric(8, 2);   -- 油車 NT$/L；電車 NT$/度

alter table drivers drop constraint if exists chk_drivers_energy_type;
alter table drivers
  add constraint chk_drivers_energy_type
  check (
    energy_type is null
    or energy_type in ('gasoline_92', 'gasoline_95', 'gasoline_98', 'diesel', 'ev')
  );

alter table bookings
  add column if not exists estimated_distance_km numeric(7, 2),
  add column if not exists estimated_energy_cost numeric(10, 2);

-- 參考油價快取（單列，id 固定 'cpc'）
create table if not exists fuel_prices (
  id text primary key,
  prices jsonb not null,           -- { "gasoline_95": 31.4, "diesel": 27.9, ... }
  source text,                     -- 'live' / 'fallback' / 'cache'
  updated_at timestamptz not null default now()
);
