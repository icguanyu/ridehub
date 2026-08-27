# 司機接駁服務預約系統 MVP - 完整開發 Prompt

## 📋 專案概述

**專案名稱：** 司機接駁服務預約系統  
**版本：** v1.0 MVP（方案 A - 司機為中心）  
**目標用戶：** 個體或小型車隊接駁司機  
**核心價值：** 讓司機有自己的專屬預約頁面，客人掃碼直接預約，預約確認時自動發送 LINE 通知

---

## 🛠️ 技術棧

| 層級 | 技術 | 版本 | 說明 |
|------|------|------|------|
| **前端** | React + Vite | 18+ | 快速編譯，適合迭代開發 |
| **CSS** | TailwindCSS | 3.x | 快速樣式，響應式設計 |
| **狀態管理** | React Query / Zustand | 最新 | 遠程狀態 + 本地狀態 |
| **後端** | Node.js (Express/Fastify) | 18+ LTS | 簡單、性能好 |
| **資料庫** | Supabase (PostgreSQL) | 最新 | 含 Auth、Realtime、Storage |
| **部署前端** | Cloudflare Pages | - | 無服務器，全球 CDN |
| **部署後端** | Cloudflare Workers / Railway | - | 後端微服務或傳統部署 |
| **第三方 API** | LINE Messaging API | v2024 | 推播通知 |

---

## 📱 MVP 功能範圍（不含以下功能）

❌ **明確不做：**
- 併車功能
- 平台司機列表/搜尋
- 支付整合（第一版由司機自己收款或客人現金付）
- GPS 即時追蹤
- 司機端 App（Web 優先）
- 客人帳戶系統（匿名預約）

✅ **v1.0 核心功能：**
1. 司機註冊 & 帳號管理
2. 司機編輯服務資訊 & 時間設定
3. 司機專屬預約連結生成
4. 客人預約表單（不需註冊）
5. 司機預約管理（接受/拒絕）
6. LINE Messaging API 推播通知
7. 基礎統計儀表板（司機月統計）
8. 簡訊備份通知（LINE 失敗時）

---

## 🗄️ 資料庫設計（Supabase PostgreSQL）

### **1. drivers 表**
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  line_id VARCHAR(100),
  
  -- 服務資訊
  service_description TEXT,
  service_areas VARCHAR(500), -- 逗號分隔: 新竹市,竹科園區
  car_type VARCHAR(50), -- 轎車, 廂型車, 麵包車
  car_plate VARCHAR(20),
  
  -- 定價
  base_price DECIMAL(10, 2), -- 基礎價格
  price_per_km DECIMAL(10, 2),
  
  -- 時間設定
  operating_hours_start TIME,
  operating_hours_end TIME,
  max_daily_bookings INT DEFAULT 10,
  
  -- 系統欄位
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_phone ON drivers(phone);
```

### **2. bookings 表**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- 客人資訊
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_line_id VARCHAR(100),
  
  -- 預約詳情
  pickup_location VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  passenger_count INT DEFAULT 1,
  special_requests TEXT,
  estimated_price DECIMAL(10, 2),
  
  -- 狀態
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, completed, cancelled
  rejected_reason TEXT,
  
  -- 系統欄位
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
```

### **3. booking_ratings 表**
```sql
CREATE TABLE booking_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  rated_by VARCHAR(50), -- 'customer' or 'driver'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_booking_id ON booking_ratings(booking_id);
```

### **4. driver_stats 表（每日更新）**
```sql
CREATE TABLE driver_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- 2026-08-01 表示 8 月
  
  total_bookings INT DEFAULT 0,
  accepted_bookings INT DEFAULT 0,
  total_customers INT DEFAULT 0, -- 不重複客人數
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  
  UNIQUE(driver_id, month)
);

CREATE INDEX idx_stats_driver_month ON driver_stats(driver_id, month);
```

### **5. notifications_log 表（追蹤推播）**
```sql
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  recipient_line_id VARCHAR(100),
  recipient_type VARCHAR(50), -- 'driver' or 'customer'
  
  notification_type VARCHAR(50), -- 'new_booking', 'booking_accepted', 'booking_rejected'
  status VARCHAR(50), -- 'sent', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_booking_id ON notifications_log(booking_id);
```

---

## 🔌 API 設計規範

### **前綴：** `/api/v1`

### **司機相關 API**

#### **1. 司機註冊 / 登入**
```
POST /api/v1/drivers/auth/register
Body: {
  name: "王小明",
  phone: "0912345678",
  email: "ming@example.com",
  password: "..."
}
Response: {
  driver: { id, name, phone },
  token: "jwt_token"
}

POST /api/v1/drivers/auth/login
Body: { phone, password }
Response: { driver, token }
```

#### **2. 司機資訊編輯**
```
GET /api/v1/drivers/:driverId
Response: { 
  id, name, phone, email, lineId,
  serviceDescription, serviceAreas, carType, carPlate,
  basePrice, pricePerKm,
  operatingHoursStart, operatingHoursEnd,
  createdAt, updatedAt
}

PUT /api/v1/drivers/:driverId
Body: { name, serviceDescription, serviceAreas, carType, ... }
Response: { driver }
```

#### **3. 司機綁定 LINE ID**
```
POST /api/v1/drivers/:driverId/bind-line
Body: { lineId: "U1234567890abcdef1234567890abcdef" }
Response: { success: true }
```

#### **4. 司機時間設定**
```
GET /api/v1/drivers/:driverId/availability
Response: {
  operatingHoursStart: "08:00",
  operatingHoursEnd: "20:00",
  maxDailyBookings: 10,
  bookedTodayCount: 5
}

PUT /api/v1/drivers/:driverId/availability
Body: {
  operatingHoursStart: "08:00",
  operatingHoursEnd: "20:00",
  maxDailyBookings: 10
}
Response: { success: true }
```

#### **5. 司機預約列表**
```
GET /api/v1/drivers/:driverId/bookings?status=pending&month=2026-08
Response: {
  bookings: [
    {
      id,
      customerName, customerPhone,
      pickupLocation, destination,
      bookingDate, bookingTime,
      status,
      createdAt
    }
  ],
  pagination: { total, page, pageSize }
}
```

#### **6. 司機接受/拒絕預約**
```
PUT /api/v1/bookings/:bookingId/accept
Response: {
  booking: { id, status: 'accepted' },
  message: "推播已發送給客人"
}

PUT /api/v1/bookings/:bookingId/reject
Body: { reason: "時間不符" }
Response: {
  booking: { id, status: 'rejected' },
  message: "拒絕通知已發送"
}
```

#### **7. 司機統計儀表板**
```
GET /api/v1/drivers/:driverId/stats?month=2026-08
Response: {
  month: "2026-08",
  totalBookings: 12,
  acceptedBookings: 10,
  totalCustomers: 8,
  totalRevenue: 8500,
  avgRating: 4.7
}
```

---

### **客人相關 API**

#### **1. 客人預約**
```
POST /api/v1/bookings
Body: {
  driverId: "uuid",
  customerName: "李小美",
  customerPhone: "0987654321",
  customerLineId: "U...", -- 可選
  pickupLocation: "新竹火車站",
  destination: "竹科園區",
  bookingDate: "2026-08-20",
  bookingTime: "14:00",
  passengerCount: 2,
  specialRequests: "需要接送行李"
}
Response: {
  booking: {
    id, status: 'pending',
    estimatedPrice: 600,
    message: "預約已提交，等待司機確認"
  }
}
```

#### **2. 客人查詢預約狀態**
```
GET /api/v1/bookings/:bookingId?token=onetime_token
Response: {
  booking: {
    id, status, customerName, customerPhone,
    pickupLocation, destination,
    bookingDate, bookingTime,
    driverName, driverPhone, driverLineId,
    createdAt, updatedAt
  }
}
```

---

### **LINE Messaging API 推播**

#### **後端內部函數（不對外公開）**
```javascript
// 推播給司機：「新預約」
await notifyDriver(driverId, {
  type: 'new_booking',
  data: {
    bookingId,
    customerName,
    pickupLocation,
    destination,
    bookingTime,
    estimatedPrice
  }
})

// 推播給客人：「司機已接受」
await notifyCustomer(customerId, {
  type: 'booking_accepted',
  data: {
    driverName,
    driverPhone,
    driverLineId
  }
})
```

---

## 💾 Supabase 設定

### **1. Authentication 設定**
- 啟用「Email」與「Phone」登入
- 自訂重導向 URL：`https://yourdomain.com/auth/callback`

### **2. Storage 設定**
- Bucket: `driver-photos`（司機頭貼、車照）
  - 權限：Public Read, Authenticated Write
- Bucket: `profile-uploads`（上傳臨時檔案）

### **3. Realtime 設定**
- 啟用 `bookings` 表的 Realtime（用於司機端即時更新）

### **4. RLS（Row Level Security）設定**
```sql
-- 司機只能看自己的資料
CREATE POLICY "drivers_select_own" ON drivers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "drivers_update_own" ON drivers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 司機只能看自己的預約
CREATE POLICY "bookings_drivers_own" ON bookings
  FOR SELECT
  USING (driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid()));
```

---

## 🎨 前端架構（React + Vite）

### **目錄結構**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── DriverDashboard.jsx        # 司機儀表板
│   │   ├── DriverEdit.jsx             # 編輯服務資訊
│   │   ├── DriverAvailability.jsx     # 時間設定
│   │   ├── BookingList.jsx            # 預約列表
│   │   ├── BookingDetail.jsx          # 預約詳情（接受/拒絕）
│   │   ├── CustomerBooking.jsx        # 客人預約表單（無認證）
│   │   ├── BookingConfirmation.jsx    # 預約確認頁面
│   │   └── Auth/
│   │       ├── DriverSignup.jsx
│   │       └── DriverLogin.jsx
│   ├── components/
│   │   ├── BookingCard.jsx
│   │   ├── StatsCard.jsx
│   │   ├── AvailabilityForm.jsx
│   │   ├── ServiceInfoForm.jsx
│   │   └── LineIDBindingModal.jsx
│   ├── hooks/
│   │   ├── useDriver.js
│   │   ├── useBookings.js
│   │   ├── useAuth.js
│   │   └── useStats.js
│   ├── services/
│   │   ├── api.js               # Axios instance
│   │   ├── supabase.js          # Supabase 初始化
│   │   └── lineMessaging.js     # LINE 推播呼叫
│   ├── store/
│   │   ├── authStore.js
│   │   ├── driverStore.js
│   │   └── bookingStore.js
│   ├── utils/
│   │   ├── formatters.js        # 時間、價格格式
│   │   ├── validators.js        # 表單驗證
│   │   └── generateShareLink.js # 生成分享連結
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### **核心頁面設計**

#### **司機專屬連結頁面**（客人看）
```
URL: yourapp.com/driver/[driverId]

顯示：
- 司機名稱、頭貼
- 服務介紹
- 車型、車牌
- 基本價格
- 營運時間
- 評分（星數）

[預約此司機] 按鈕 → 跳轉到預約表單
```

#### **客人預約表單**
```
顯示司機名稱（確認是否預約正確司機）

表單欄位：
☐ 你的名字 *
☐ 你的電話 *
☐ LINE ID（可選，用於推播）
☐ 上車地點 *
☐ 目的地 *
☐ 預計日期 *
☐ 預計時間 *
☐ 人數 *
☐ 特殊需求（可選）

預估價格顯示：
  基礎價格 NT$X
  距離估算費 NT$Y
  ─────────────
  合計 NT$Z

[確認預約] 按鈕

預約確認後：
"預約已提交！司機將在 24 小時內回覆"
QR Code/Link：「分享預約狀態給司機」
```

#### **司機儀表板**
```
頂部統計卡片：
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 本月接單    │ │ 平均評分    │ │ 本月收入    │
│   12 筆     │ │   4.8 ⭐   │ │  NT$8,500  │
└─────────────┘ └─────────────┘ └─────────────┘

[編輯服務資訊] [設定時間] [綁定 LINE]

預約列表（分頁）：
┌──────────────────────────────────────────────┐
│ 待確認 (5) │ 已確認 (6) │ 已完成 (12)       │
├──────────────────────────────────────────────┤
│ 李小美 - 新竹火車站 → 竹科 - 08/20 14:00    │
│ 狀態：[待確認] [接受] [拒絕]                  │
│                                               │
│ 王先生 - 松山機場 → 內湖 - 08/19 10:30      │
│ 狀態：[已接受] ⭐ 5.0  "司機很專業"         │
└──────────────────────────────────────────────┘
```

---

## 🔧 後端架構（Node.js + Express）

### **目錄結構**
```
backend/
├── src/
│   ├── routes/
│   │   ├── drivers.js
│   │   ├── bookings.js
│   │   ├── auth.js
│   │   └── stats.js
│   ├── controllers/
│   │   ├── driverController.js
│   │   ├── bookingController.js
│   │   ├── authController.js
│   │   └── statsController.js
│   ├── middlewares/
│   │   ├── auth.js              # JWT 驗證
│   │   ├── errorHandler.js
│   │   └── validation.js        # 輸入驗證
│   ├── services/
│   │   ├── supabaseService.js
│   │   ├── lineMessagingService.js
│   │   ├── smsService.js        # 簡訊備份（Twilio）
│   │   └── emailService.js      # Email 確認
│   ├── utils/
│   │   ├── logger.js
│   │   ├── errorHandler.js
│   │   └── generateToken.js
│   ├── config/
│   │   ├── database.js
│   │   ├── supabase.js
│   │   └── lineConfig.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

### **核心業務邏輯**

#### **客人提交預約流程**
```javascript
// POST /api/v1/bookings
1. 驗證輸入欄位
2. 檢查司機是否存在
3. 檢查預約時間是否在司機營運時間內
4. 計算預估價格
5. 建立預約記錄（status = 'pending'）
6. **推送 LINE 通知給司機**
7. 回傳預約確認給客人
```

#### **司機接受預約流程**
```javascript
// PUT /api/v1/bookings/:bookingId/accept
1. 驗證司機身份
2. 更新預約狀態為 'accepted'
3. 取得客人 LINE ID
4. **推送 LINE 通知給客人**（司機名稱、電話、LINE ID）
5. 發送簡訊備份通知
6. 記錄 notification log
7. 回傳成功訊息
```

#### **LINE 推播通知邏輯**
```javascript
const notifyDriver = async (driverId, booking) => {
  // 1. 取得司機的 LINE ID
  const driver = await supabase
    .from('drivers')
    .select('line_id')
    .eq('id', driverId)
    .single();

  if (!driver.line_id) {
    console.warn(`Driver ${driverId} has no LINE ID`);
    return; // 司機沒綁定 LINE，跳過
  }

  // 2. 組合推播訊息
  const message = {
    type: 'text',
    text: `📋 新預約\n客人：${booking.customerName}\n時間：${booking.bookingDate} ${booking.bookingTime}\n上車：${booking.pickupLocation}\n目的地：${booking.destination}\n價格：NT$${booking.estimatedPrice}`
  };

  // 3. 呼叫 LINE Messaging API
  try {
    await lineClient.pushMessage(driver.line_id, message);
    
    // 4. 記錄推播日誌
    await supabase
      .from('notifications_log')
      .insert({
        booking_id: booking.id,
        recipient_line_id: driver.line_id,
        recipient_type: 'driver',
        notification_type: 'new_booking',
        status: 'sent'
      });
  } catch (error) {
    console.error('LINE notification failed:', error);
    
    // 5. 記錄失敗，改用簡訊通知（備用方案）
    await sendSMSNotification(driver.phone, `新預約：${booking.customerName}，時間 ${booking.bookingTime}`);
  }
};
```

---

## 🔐 環境變數（.env）

```env
# 伺服器
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxxxx
SUPABASE_SERVICE_KEY=eyJxxxxx

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=Channel Access Token
LINE_CHANNEL_SECRET=Channel Secret

# 簡訊服務（Twilio）
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+886912345678

# Email 服務（SendGrid）
SENDGRID_API_KEY=xxx

# Cloudflare（如果用 Workers）
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# 前端
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## 📊 開發時程表（預估）

| Phase | 工作項目 | 週數 | 交付物 |
|-------|---------|------|--------|
| **Phase 1** | DB 設計 + Supabase 初始化 + 基礎認證 | 1.5 | 資料庫 schema + Auth API |
| **Phase 2** | 司機後端 API（編輯、時間、列表） | 2 | CRUD API + 驗證 |
| **Phase 3** | 客人預約 API + 預估價格邏輯 | 1.5 | 預約 API + 計價邏輯 |
| **Phase 4** | LINE 推播整合 + SMS 備用 | 1.5 | 推播函數 + 通知日誌 |
| **Phase 5** | 司機前端（登入、編輯、時間設定、統計） | 2 | 司機儀表板完成 |
| **Phase 6** | 客人前端（預約表單、確認頁） | 1.5 | 客人預約流程完成 |
| **Phase 7** | 司機預約管理頁面（接受/拒絕） | 1 | 預約列表 + 操作 |
| **Phase 8** | 測試 + Bug Fix + 微調 | 1.5 | MVP 穩定版 |
| **Phase 9** | 部署（Cloudflare Pages + Workers/Railway） | 0.5 | 上線 |
| **總計** | | **12-14 週** | **可上線 MVP** |

---

## 🚀 上線前檢查清單

- [ ] 所有 API 通過 Postman 測試
- [ ] 線上表單驗證完善（顯示錯誤訊息）
- [ ] LINE 推播已測試（使用沙盒帳號）
- [ ] 簡訊備用方案已測試
- [ ] 司機、客人流程已試用（邀請 2-3 位試用者）
- [ ] 隱私政策、服務條款已撰寫
- [ ] Supabase RLS 安全設定檢查
- [ ] 環境變數已妥善管理（不上傳到 Git）
- [ ] 錯誤頁面（404、500）已設計
- [ ] 移動裝置響應式設計已確認

---

## 📚 參考資源

- **Supabase 文件：** https://supabase.com/docs
- **LINE Messaging API：** https://developers.line.biz/en/reference/messaging-api/
- **React 18 文件：** https://react.dev/
- **TailwindCSS：** https://tailwindcss.com/docs
- **Cloudflare Pages：** https://pages.cloudflare.com/
- **Express 最佳實踐：** https://expressjs.com/

---

## 📌 核心提醒

1. **不要過度設計** — MVP 是驗證想法的工具，不是完整產品
2. **優先上線而非完美** — 8-10 週上線勝過 6 個月完美但沒人用
3. **蒐集真實反饋** — 邀請司機試用，根據反饋迭代 v2.0
4. **隱私第一** — 司機資料保護好，否則無法建立信任
5. **保持簡潔** — 每個頁面、每個按鈕都要有目的，不要堆砌功能

---

**版本：** v1.0  
**最後更新：** 2026-08-27  
**維護者：** Nick  
