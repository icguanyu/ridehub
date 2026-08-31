-- ============================================================
-- RideHub — 司機刪除行程（軟刪）
-- 保留資料列以供日後統計（信用率：無故取消/完成、刪除紀錄）。
-- ============================================================

alter table bookings
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references drivers(id) on delete set null;

-- 未刪除的行程才是常用查詢範圍
create index if not exists idx_bookings_active
  on bookings(driver_id)
  where deleted_at is null;
