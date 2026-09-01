-- ============================================================
-- RideHub — 司機大頭貼
-- ============================================================
-- 存的是 Storage 內的相對路徑（bucket: driver-avatars，公開讀取），
-- 例如 "{driverId}/avatar-1725110000000.webp"。
-- 公開 URL 由後端 serializer 用 getPublicUrl(path) 組出來，不另存欄位。
-- ============================================================

alter table drivers add column if not exists avatar_path text;
