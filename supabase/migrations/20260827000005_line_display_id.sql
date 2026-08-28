-- 司機對外公開的 LINE ID（如 @myid 或 myid），與內部 Messaging API 的 line_id 分開
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS line_display_id varchar(100);
