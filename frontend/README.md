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

## 結構

```
src/
├── lib/         # api(axios)、queryClient
├── store/       # authStore（zustand + persist）
├── components/  # ProtectedRoute、DashboardLayout、Spinner
└── pages/       # 各頁面（Step 7 為佔位，Step 8-9 實作）
```
