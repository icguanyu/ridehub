-- ============================================================
-- RideHub — 司機可載客人數上限
-- 預約建立時的 passenger_count 不得超過此值。
-- ============================================================

alter table drivers
  add column if not exists max_passengers int not null default 4;

alter table drivers drop constraint if exists chk_drivers_max_passengers;
alter table drivers
  add constraint chk_drivers_max_passengers
  check (max_passengers between 1 and 20);
