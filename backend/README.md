# RideHub Backend

Node.js 20 + Express，提供 `/api/v1` API。

## 開發

```bash
npm install
cp .env.example .env   # 填入 Supabase / JWT / LINE 等金鑰
npm run dev            # http://localhost:3000（--watch 自動重啟）
```

## API 文件（Swagger）

| 路徑 | 說明 |
|------|------|
| `/api/v1/docs` | Swagger UI（可互動測試）|
| `/api/v1/openapi.json` | OpenAPI 3 規格（JSON）|

規格原始檔：[`openapi.yaml`](openapi.yaml)。

## 已完成的端點

| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/v1/health` · `/health/db` | 存活檢查 / Supabase 連線 |
| POST | `/api/v1/drivers/auth/register` | 司機註冊 → `{ driver, token }` |
| POST | `/api/v1/drivers/auth/login` | 司機登入（phone + password）→ `{ driver, token, supabase }` |
| GET·PUT | `/api/v1/drivers/:id` | 讀取 / 編輯服務資訊 🔒 |
| POST | `/api/v1/drivers/:id/bind-line` | 綁定 LINE ID 🔒 |
| GET·PUT | `/api/v1/drivers/:id/availability` | 營運時間 + 每日名額 🔒 |
| GET | `/api/v1/drivers/:id/bookings` | 預約列表（status / month / 分頁）🔒 |
| GET | `/api/v1/drivers/:id/stats` | 當月統計 🔒 |
| POST | `/api/v1/bookings` | 客人匿名建立預約 → `{ booking, statusToken }` |
| GET | `/api/v1/bookings/:id?token=` | 客人查預約狀態（accepted 才揭露司機聯絡方式）|
| PUT | `/api/v1/bookings/:id/accept` | 司機接受 🔒 → 通知客人 |
| PUT | `/api/v1/bookings/:id/reject` | 司機拒絕（body: reason）🔒 → 通知客人 |

🔒 = 需 `Authorization: Bearer <token>`

## 通知（LINE）

- `POST /bookings` 成功後以 LINE 通知司機；客人回應報價後同樣以 LINE 通知司機。
- 客人不推播，改由狀態頁 / 手機查詢查看進度。
- 每次結果寫入 `notifications_log`；通知失敗**不影響**主流程。
- 未填 `LINE_CHANNEL_ACCESS_TOKEN` 時自動略過（記為 `skipped`），填了即生效。

## 認證機制

- 帳密存於 **Supabase Auth**（`auth.users`），`drivers.user_id` 外鍵關聯。
- 登入以「手機 → 反查 email → Supabase 驗證密碼」。
- 驗證成功後，後端另簽一組 **自有 JWT**（`Authorization: Bearer <token>`）供 API 使用；
  `login` 另附 Supabase session token，供前端日後直連 Realtime。

## 目錄

```
src/
├── config/        # 環境變數驗證、Supabase client
├── routes/        # 路由定義
├── controllers/   # 請求處理 + zod 驗證
├── services/      # 商業邏輯（與 Supabase 互動）
├── serializers/   # DB snake_case → API camelCase
├── middlewares/   # auth、validate、errorHandler
└── utils/         # jwt、logger、ApiError、validators
```
