-- ============================================================
-- RideHub — superadmin 後台
-- 司機停權欄位 + admin 操作紀錄
-- ============================================================

alter table drivers
  add column if not exists suspended_at timestamptz;

create index if not exists idx_drivers_suspended on drivers(suspended_at) where suspended_at is not null;

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,              -- 'verify' / 'unverify' / 'suspend' / 'unsuspend'
  target_type text,                  -- 'driver' / 'booking'
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_actions_created on admin_actions(created_at desc);
