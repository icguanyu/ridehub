# RideHub — 司機接駁服務預約系統 (MVP v1.0)

讓接駁司機擁有專屬預約頁面，客人掃碼即可匿名預約，預約狀態變更時透過 LINE 通知。

> 方案 A：司機為中心。完整規格見 [driver_booking_system_prompt.md](driver_booking_system_prompt.md)。

## 專案結構

```
ridehub/
├── backend/    # Node.js + Express API (/api/v1)；Swagger 文件在 /api/v1/docs
├── frontend/   # React + Vite + Mantine
├── supabase/   # DB migrations & 設定
├── DEPLOY.md   # 部署指南（Cloud Run + Cloudflare Pages）
├── TESTING.md  # 測試說明
└── driver_booking_system_prompt.md   # 開發規格
```

## 上線位置

| | 網址 |
|---|---|
| 前端 | <https://ridehub-2h3.pages.dev> |
| 後端 API | <https://ridehub-api-239173126142.asia-east1.run.app/api/v1> |
| API 文件 | `<後端>/api/v1/docs` |

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + TailwindCSS + React Query/Zustand |
| 後端 | Node.js 20 + Express |
| 資料庫 / Auth | Supabase (PostgreSQL) |
| 通知 | LINE Messaging API（推播給司機）|
| 部署 | Cloudflare Pages (前端) + Workers/Railway (後端) |

## 開發進度

- [x] 0. 專案初始化
- [x] 1. Supabase 專案 + DB schema
- [x] 2. 後端骨架
- [x] 3. 認證 API
- [x] 4. 司機 API
- [x] 5. 客人預約 API
- [x] 6. LINE 推播（司機）
- [x] 7. 前端骨架
- [x] 8. 司機前端頁面
- [x] 9. 客人前端頁面
- [x] 10. 整合測試
- [ ] 11. 部署

## 本機開發

```bash
# 後端
cd backend && npm install && npm run dev

# 前端
cd frontend && npm install && npm run dev
```

環境變數請複製 `backend/.env.example` → `backend/.env`，並填入實際金鑰。
