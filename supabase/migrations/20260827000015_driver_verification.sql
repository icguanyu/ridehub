-- ============================================================
-- RideHub — 司機信任驗證
-- ============================================================
-- 定案範圍：
--   自動判定（不進此表，由後端即時讀既有資料）：
--     email  → auth.users.email_confirmed_at
--     line   → drivers.line_id 是否已綁定
--   需上傳 / 需人工審核（存這張表，一個 driver 每種 kind 一列）：
--     phone           手機（發碼到 LINE，回填正確即 approved，不需人工）
--     photo           真人大頭貼（審核目前的 avatar）
--     vehicle_license  行照 / 車牌
--     driver_license   駕照正反面
--     selfie_id        手持證件自拍
--     identity         姓名 + 生日（審駕照時一併確認，無上傳檔）
--
--   分數只計 status = 'approved'。滿分 11：
--     email 1, line 1, phone 1, photo 1,
--     vehicle_license 2, driver_license 2, selfie_id 2, identity 1
--   號誌：red 0-2 / yellow 3-6 / green 7+
--
--   證件檔放「私有」bucket driver-docs，只有後端 service_role 讀得到；
--   公開 API 只回 trust_score / trust_level / 已通過項目名稱，不回檔案。
-- ============================================================

-- ── drivers：信任分數快取（審核動作後由後端重算）──
alter table drivers add column if not exists trust_score int not null default 0;
alter table drivers add column if not exists trust_level text not null default 'red'
  check (trust_level in ('red', 'yellow', 'green'));

-- ── 驗證項目 ──
create table if not exists driver_verifications (
  id             uuid primary key default gen_random_uuid(),
  driver_id      uuid not null references drivers(id) on delete cascade,
  kind           text not null check (kind in
                 ('phone', 'photo', 'vehicle_license', 'driver_license', 'selfie_id', 'identity')),
  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  file_path      text,           -- 私有 bucket 內路徑；phone / identity 為 null
  submitted_data jsonb,          -- phone: {"phone":"09..."}  identity: {"name":"...","birthday":"YYYY-MM-DD"}
  note           text,           -- 駁回原因 / 審核備註（司機看得到）
  reviewed_by    text,           -- admin email
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (driver_id, kind)
);

create index if not exists idx_driver_verifications_driver on driver_verifications(driver_id);
-- admin 待審佇列
create index if not exists idx_driver_verifications_pending
  on driver_verifications(created_at) where status = 'pending';

drop trigger if exists trg_driver_verifications_updated_at on driver_verifications;
create trigger trg_driver_verifications_updated_at
  before update on driver_verifications
  for each row execute function set_updated_at();

-- ── 手機驗證碼（發到 LINE，一個司機同時只有一組）──
create table if not exists phone_verify_codes (
  driver_id  uuid primary key references drivers(id) on delete cascade,
  phone      varchar(20) not null,
  code_hash  text not null,        -- 存 hash，不存明碼
  expires_at timestamptz not null,
  attempts   int not null default 0,
  created_at timestamptz not null default now()
);

-- ── RLS：兩張表都只給後端 service_role（enable 但不建 policy）──
alter table driver_verifications enable row level security;
alter table phone_verify_codes   enable row level security;
