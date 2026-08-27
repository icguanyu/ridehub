-- ============================================================
-- RideHub MVP v1.0 — 初始 Schema
-- 對應規格：driver_booking_system_prompt.md 「資料庫設計」
-- ============================================================

-- 自動更新 updated_at 的共用函數
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. drivers 司機
-- ------------------------------------------------------------
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name varchar(100) not null,
  phone varchar(20) not null unique,
  email varchar(100),
  line_id varchar(100),

  -- 服務資訊
  service_description text,
  service_areas varchar(500),        -- 逗號分隔：新竹市,竹科園區
  car_type varchar(50),              -- 轎車 / 廂型車 / 麵包車
  car_plate varchar(20),

  -- 定價
  base_price numeric(10, 2),
  price_per_km numeric(10, 2),

  -- 時間設定
  operating_hours_start time,
  operating_hours_end time,
  max_daily_bookings int default 10,

  -- 系統欄位
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_drivers_user_id on drivers(user_id);
create index if not exists idx_drivers_phone on drivers(phone);

drop trigger if exists trg_drivers_updated_at on drivers;
create trigger trg_drivers_updated_at
  before update on drivers
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 2. bookings 預約
-- ------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,

  -- 客人資訊
  customer_name varchar(100) not null,
  customer_phone varchar(20) not null,
  customer_line_id varchar(100),

  -- 預約詳情
  pickup_location varchar(200) not null,
  destination varchar(200) not null,
  booking_date date not null,
  booking_time time not null,
  passenger_count int default 1,
  special_requests text,
  estimated_price numeric(10, 2),

  -- 狀態：pending / accepted / rejected / completed / cancelled
  status varchar(50) not null default 'pending',
  rejected_reason text,

  -- 系統欄位
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,

  constraint chk_bookings_status
    check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled'))
);

create index if not exists idx_bookings_driver_id on bookings(driver_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_date on bookings(booking_date);

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- 3. booking_ratings 評分
-- ------------------------------------------------------------
create table if not exists booking_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  review text,
  rated_by varchar(50),              -- 'customer' or 'driver'
  created_at timestamptz default now()
);

create index if not exists idx_ratings_booking_id on booking_ratings(booking_id);

-- ------------------------------------------------------------
-- 4. driver_stats 司機月統計
-- ------------------------------------------------------------
create table if not exists driver_stats (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  month date not null,               -- 2026-08-01 表示 8 月

  total_bookings int default 0,
  accepted_bookings int default 0,
  total_customers int default 0,     -- 不重複客人數
  total_revenue numeric(12, 2) default 0,
  avg_rating numeric(3, 2) default 0,

  unique(driver_id, month)
);

create index if not exists idx_stats_driver_month on driver_stats(driver_id, month);

-- ------------------------------------------------------------
-- 5. notifications_log 推播紀錄
-- ------------------------------------------------------------
create table if not exists notifications_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  recipient_line_id varchar(100),
  recipient_type varchar(50),        -- 'driver' or 'customer'

  notification_type varchar(50),     -- 'new_booking' / 'booking_accepted' / 'booking_rejected'
  status varchar(50),                -- 'sent' / 'failed'
  error_message text,

  created_at timestamptz default now()
);

create index if not exists idx_notif_booking_id on notifications_log(booking_id);
