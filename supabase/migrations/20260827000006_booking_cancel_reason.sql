-- ============================================================
-- RideHub — 司機取消預約（帶理由）
-- cancelled 狀態已存在；補上取消原因與時間欄位。
-- ============================================================

alter table bookings
  add column if not exists cancelled_reason text,
  add column if not exists cancelled_at timestamptz;
