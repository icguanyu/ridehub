-- ============================================================
-- RideHub — 往返行程 + 司機重新報價
-- ============================================================

-- 1. bookings 新增欄位
alter table bookings
  add column if not exists trip_type   varchar(20) not null default 'one_way',
  add column if not exists return_date  date,
  add column if not exists return_time  time,
  add column if not exists quoted_price numeric(10, 2),
  add column if not exists quoted_at    timestamptz,
  add column if not exists quote_note   text;

-- 2. trip_type 限值
alter table bookings drop constraint if exists chk_bookings_trip_type;
alter table bookings
  add constraint chk_bookings_trip_type
  check (trip_type in ('one_way', 'round_trip'));

-- 3. 往返時 return_date / return_time 必填
alter table bookings drop constraint if exists chk_bookings_return;
alter table bookings
  add constraint chk_bookings_return
  check (
    trip_type = 'one_way'
    or (return_date is not null and return_time is not null)
  );

-- 4. status 新增 'quoted'
alter table bookings drop constraint if exists chk_bookings_status;
alter table bookings
  add constraint chk_bookings_status
  check (status in ('pending', 'quoted', 'accepted', 'rejected', 'completed', 'cancelled'));

-- 5. 依回程日查詢名額用
create index if not exists idx_bookings_return_date on bookings(return_date);
