# RideHub Backend

Node.js 20 + Express，提供 `/api/v1` API。

## 開發

```bash
npm install
cp .env.example .env   # 填入 Supabase / JWT / LINE 等金鑰
npm run dev            # http://localhost:3000（--watch 自動重啟）
```

## 已完成的端點

| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/v1/health` | 存活檢查 |
| GET | `/api/v1/health/db` | 檢查 Supabase 連線 |
| POST | `/api/v1/drivers/auth/register` | 司機註冊（name, phone, email, password）→ `{ driver, token }` |
| POST | `/api/v1/drivers/auth/login` | 司機登入（phone, password）→ `{ driver, token, supabase }` |

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
