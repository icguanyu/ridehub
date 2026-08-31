-- ============================================================
-- RideHub — 司機乘客責任險保額（萬元）
-- 有填才會顯示在公開頁；未填 = 未提供。
-- ============================================================

alter table drivers
  add column if not exists passenger_insurance_wan int;

alter table drivers drop constraint if exists chk_drivers_passenger_insurance;
alter table drivers
  add constraint chk_drivers_passenger_insurance
  check (passenger_insurance_wan is null or (passenger_insurance_wan >= 0 and passenger_insurance_wan <= 99999));
