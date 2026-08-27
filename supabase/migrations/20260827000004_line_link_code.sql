-- ============================================================
-- RideHub — LINE 綁定碼
-- 司機在後台產生一組短碼，加官方帳號好友後把碼傳給它，
-- webhook 收到後把該司機的 line_id 綁定。
-- ============================================================

alter table drivers
  add column if not exists line_link_code varchar(12),
  add column if not exists line_link_code_expires_at timestamptz;

create index if not exists idx_drivers_line_link_code
  on drivers(line_link_code)
  where line_link_code is not null;
