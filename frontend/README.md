# RideHub Frontend

React 19 + Vite + TailwindCSS 3 + React Router 7 + React Query 5 + Zustand。

## 開發

```bash
npm install
cp .env.example .env      # 預設已指向 http://localhost:3000/api/v1
npm run dev               # http://localhost:5173
```

需同時啟動 backend（`cd ../backend && npm run dev`）。Vite 已設定 `/api` proxy 到 :3000。

## 路由

| 路徑 | 頁面 | 對象 |
|------|------|------|
| `/login` `/signup` | 登入 / 註冊 | 司機 |
| `/dashboard` | 總覽（統計 + 待確認）| 司機 🔒 |
| `/dashboard/bookings` `/dashboard/bookings/:id` | 預約列表 / 詳情 | 司機 🔒 |
| `/dashboard/edit` | 服務資訊 + 綁 LINE | 司機 🔒 |
| `/dashboard/availability` | 營運時間設定 | 司機 🔒 |
| `/driver/:driverId` | 司機專屬公開頁 | 客人 |
| `/driver/:driverId/book` | 預約表單 | 客人 |
| `/booking/:bookingId?token=` | 預約狀態查詢 | 客人 |

🔒 = `ProtectedRoute`，未登入導向 `/login`

## 環境變數

前端只有一個「必要」變數（Vite 會在 **build 時** 內嵌，需 `VITE_` 前綴）：

| 變數 | 用途 | 本機 | 正式 |
|------|------|------|------|
| `VITE_API_BASE_URL` | 後端 API base（**含 `/api/v1`**）| `http://localhost:3000/api/v1` | `https://<後端網域>/api/v1` |
| `VITE_SUPABASE_URL` | 目前**未使用**，保留給日後 Realtime | — | — |
| `VITE_SUPABASE_ANON_KEY` | 同上 | — | — |

- 本機：複製 `.env.example` → `.env`（`.env` 已 gitignore）。
- Cloudflare Pages：專案 Settings → Environment variables 設 `VITE_API_BASE_URL`
  （Production 與 Preview 各設一次）；Build command `npm run build`、Output `dist`、Root `frontend`。
- `public/_redirects` 已加入 SPA fallback，讓 `/driver/:id` 等深層連結不會 404。

## 結構

```
src/
├── lib/         # api(axios)、queryClient
├── store/       # authStore（zustand + persist）
├── components/  # ProtectedRoute、DashboardLayout、Spinner
└── pages/       # 各頁面（Step 7 為佔位，Step 8-9 實作）
```
