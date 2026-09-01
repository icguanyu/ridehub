# 司機接駁系統 - 系統防禦方案完整指南

**版本：** v1.0  
**最後更新：** 2026-09-01  
**維護者：** Nick  

---

## 📋 目錄

1. [威脅清單](#威脅清單)
2. [5 層防禦架構](#5-層防禦架構)
3. [MVP 階段實踐方案](#mvp-階段實踐方案)
4. [部署前檢查清單](#部署前檢查清單)
5. [代碼實作範本](#代碼實作範本)
6. [監控與檢測](#監控與檢測)
7. [應急響應計劃](#應急響應計劃)

---

## 🎯 威脅清單

### 常見攻擊手法分析

| 攻擊手法 | 風險程度 | 攻擊原理 | 可能後果 | 防禦難度 |
|---------|---------|--------|--------|---------|
| **SQL Injection** | 🔴 極高 | 在輸入欄位插入 SQL 語句竊取或修改資料 | 竊取所有司機/客人資料、資料庫被清空 | 🟢 容易防禦 |
| **API 暴破（Brute Force）** | 🔴 極高 | 自動試 10,000 個 password 組合 | 帳號被盜用、司機被冒名頂替 | 🟢 容易防禦 |
| **DDoS 攻擊** | 🟡 中 | 大量垃圾請求癱瘓伺服器 | 系統無法使用、用戶無法預約 | 🟡 需要專業工具 |
| **會話劫持（Session Hijacking）** | 🔴 極高 | 盜取 JWT token 冒充司機登入 | 駭客接受假預約、修改司機資訊 | 🟢 容易防禦 |
| **跨站請求偽造（CSRF）** | 🟡 中 | 利用司機已登入狀態執行非預期操作 | 司機被誘騙批准危險操作 | 🟢 容易防禦 |
| **中間人攻擊（MITM）** | 🔴 極高 | 攔截 HTTP 明文流量 | 密碼、個資、LINE ID 洩露 | 🟢 用 HTTPS 防禦 |
| **數據竊取** | 🔴 極高 | 未授權存取資料庫或 API | 司機電話、客人隱私洩露 | 🟢 用 RLS + 驗證防禦 |
| **惡意登入** | 🔴 極高 | 頻繁錯誤登入嘗試猜測密碼 | 帳號被鎖定、拒絕服務 | 🟢 容易防禦 |
| **上傳惡意檔案** | 🟡 中 | 司機上傳駕照照片時隱含病毒 | 伺服器被植入後門 | 🟡 需要文件驗證 |
| **XSS（跨站腳本）** | 🟡 中 | 在預約表單注入 JavaScript | 客人在妳的網站被竊取資料 | 🟢 容易防禦 |

### 攻擊難度 vs 風險矩陣

```
風險
高   │  ◆ SQL Injection      ◆ API 暴破          ◆ 會話劫持
     │  ◆ 數據竊取           ◆ 中間人攻擊        ◆ 惡意登入
     │
     │  ◇ DDoS              ◇ XSS               ◇ 檔案上傳
低    │  ◇ CSRF
     └────────────────────────────────────────
       容易防禦        中等難度        難以完全防禦
                    防禦難度
```

**結論：** 最危險的 4 項（SQL Injection、API 暴破、會話劫持、MITM）都容易防禦。

---

## 🛡️ 5 層防禦架構

### 層級概覽

```
┌─────────────────────────────────────────────────────────┐
│ 第 5 層：法律 & 條款                                      │
│ (服務條款、漏洞回報計劃、法律威懾)                       │
├─────────────────────────────────────────────────────────┤
│ 第 4 層：監控 & 檢測                                      │
│ (異常行為監控、日誌記錄、實時告警)                       │
├─────────────────────────────────────────────────────────┤
│ 第 3 層：數據安全                                         │
│ (加密、HTTPS、CORS、資料庫隔離)                          │
├─────────────────────────────────────────────────────────┤
│ 第 2 層：認證安全                                         │
│ (身份驗證、異常檢測、二步驗證)                           │
├─────────────────────────────────────────────────────────┤
│ 第 1 層：代碼安全                                         │
│ (Parameterized Queries、驗證、速率限制)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 第 1 層：代碼安全（後端）

### 1.1 防止 SQL Injection

#### **問題：** 惡意 SQL 語句導致資料庫被攻擊

```javascript
// ❌ 危險的做法（永遠別這樣）
const phone = req.body.phone;
const query = `SELECT * FROM drivers WHERE phone = '${phone}'`;
const result = await db.query(query);

// 如果 phone = "' OR '1'='1"，SQL 變成：
// SELECT * FROM drivers WHERE phone = '' OR '1'='1'
// 這樣就能取得所有司機資料！
```

#### **解決方案：** 使用 Parameterized Queries

```javascript
// ✅ 安全的做法（一定要用這個）
const phone = req.body.phone;
const query = 'SELECT * FROM drivers WHERE phone = $1';
const result = await db.query(query, [phone]);

// SQL 和參數分開，即使 phone 是惡意字串
// 也只會被當成「資料」而不是「SQL 命令」
```

#### **在 Express + PostgreSQL 中實踐**

```javascript
// backend/src/services/databaseService.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ✅ 正確：使用 parameterized query
async function getDriverByPhone(phone) {
  const query = 'SELECT id, name, email FROM drivers WHERE phone = $1';
  const result = await pool.query(query, [phone]);
  return result.rows[0] || null;
}

// ✅ 正確：更新操作
async function updateDriverInfo(driverId, name, email) {
  const query = 'UPDATE drivers SET name = $1, email = $2 WHERE id = $3';
  await pool.query(query, [name, email, driverId]);
}

// ❌ 錯誤：字串拼接（永遠別用）
async function getDriverByPhoneBad(phone) {
  const query = `SELECT * FROM drivers WHERE phone = '${phone}'`;
  return await pool.query(query);
}

module.exports = { getDriverByPhone, updateDriverInfo };
```

### 1.2 API 驗證 & 授權

#### **原則：** 每個 API 都要檢查「你是誰」和「你能做什麼」

```javascript
// backend/src/middlewares/auth.js

const jwt = require('jsonwebtoken');

/**
 * 驗證 JWT token
 * 確保請求攜帶有效的身份憑證
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];  // "Bearer eyJxxx"
  
  if (!token) {
    logger.warn(`API called without token: ${req.method} ${req.path}`);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: '請先登入' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, phone, role }
    next();
  } catch (err) {
    logger.warn(`Invalid token: ${err.message}`);
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Token 無效或過期' 
    });
  }
};

/**
 * 授權檢查：司機只能看自己的資料
 */
const authorizeSelfOnly = (req, res, next) => {
  const requestedDriverId = req.params.driverId;
  const authenticatedUserId = req.user.id;
  
  if (requestedDriverId !== authenticatedUserId) {
    logger.error(
      `Unauthorized access attempt: user ${authenticatedUserId} ` +
      `tried to access driver ${requestedDriverId} data`
    );
    return res.status(403).json({ 
      error: 'Forbidden',
      message: '無權限存取此資源' 
    });
  }
  
  next();
};

/**
 * 授權檢查：只有司機能呼叫此 API
 */
const authorizeDriverOnly = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: '此 API 僅司機可用' 
    });
  }
  next();
};

module.exports = {
  authenticateJWT,
  authorizeSelfOnly,
  authorizeDriverOnly
};
```

#### **在路由中使用**

```javascript
// backend/src/routes/drivers.js

const express = require('express');
const router = express.Router();
const {
  authenticateJWT,
  authorizeSelfOnly,
  authorizeDriverOnly
} = require('../middlewares/auth');

// 取得司機的預約列表
router.get(
  '/:driverId/bookings',
  authenticateJWT,          // 第 1 層：驗證身份
  authorizeSelfOnly,        // 第 2 層：檢查是否本人
  authorizeDriverOnly,      // 第 3 層：檢查角色
  (req, res) => {
    // 只有通過以上 3 層檢查，才會執行這裡的邏輯
    const { driverId } = req.params;
    const bookings = getDriverBookings(driverId);
    res.json(bookings);
  }
);

// 更新司機資訊
router.put(
  '/:driverId',
  authenticateJWT,
  authorizeSelfOnly,
  async (req, res) => {
    // 只能更新自己的資訊
    const { driverId } = req.params;
    const { name, email } = req.body;
    
    await updateDriver(driverId, { name, email });
    res.json({ success: true });
  }
);

module.exports = router;
```

### 1.3 速率限制（Rate Limiting）

#### **目的：** 防止暴力破解和 DDoS 攻擊

```javascript
// backend/src/middlewares/rateLimit.js

const rateLimit = require('express-rate-limit');

/**
 * 登入速率限制
 * 同一 IP 5 分鐘內最多 5 次登入嘗試
 * 防止駭客暴力猜測密碼
 */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,              // 時間窗口：5 分鐘
  max: 5,                                // 最多請求數：5 次
  message: {
    error: 'Too many login attempts',
    message: '登入嘗試過多，請在 5 分鐘後再試'
  },
  standardHeaders: true,                 // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,                  // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // 跳過某些情況（例如本機開發）
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

/**
 * API 通用速率限制
 * 同一 IP 每分鐘最多 100 個 API 請求
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,               // 1 分鐘
  max: 100,                              // 100 個請求
  message: '請求過於頻繁，請稍後再試',
  keyGenerator: (req) => {
    // 使用 user ID 或 IP 作為限流鍵
    return req.user?.id || req.ip;
  }
});

/**
 * 預約 API 速率限制
 * 防止司機在短時間內建立大量假預約
 */
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,              // 1 小時
  max: 50,                               // 最多 50 個新預約
  message: '妳在 1 小時內建立過多預約，請稍後再試'
});

module.exports = {
  loginLimiter,
  apiLimiter,
  bookingLimiter
};
```

#### **在路由中使用**

```javascript
// backend/src/routes/auth.js

const express = require('express');
const router = express.Router();
const { loginLimiter } = require('../middlewares/rateLimit');

// 登入：受限
router.post('/login', loginLimiter, async (req, res) => {
  const { phone, password } = req.body;
  // 登入邏輯...
});

// 註冊：也應該限制
router.post('/register', 
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: '短時間內註冊過多帳號'
  }),
  async (req, res) => {
    // 註冊邏輯...
  }
);

module.exports = router;
```

**實踐效果：**
```
駭客想暴破 10,000 個司機帳號
  ├─ 每 IP 每 5 分鐘最多 5 次
  ├─ 需要 40 個不同 IP（or 換代理）
  ├─ 需要 40 × 5 分鐘 = 200 分鐘
  ├─ 實務上很難做到
  └─ 成本遠超過收益

結論：駭客會放棄，轉向目標更軟的應用
```

### 1.4 輸入驗證

#### **原則：** 永遠不要相信用戶輸入

```javascript
// backend/src/utils/validators.js

const validator = require('validator');

/**
 * 驗證電話號碼
 */
function validatePhone(phone) {
  // 檢查長度
  if (!phone || phone.length !== 10) {
    throw new Error('電話號碼必須是 10 位數字');
  }
  
  // 檢查格式（台灣手機 09xx-xxx-xxx）
  if (!/^09\d{8}$/.test(phone)) {
    throw new Error('電話號碼格式不正確');
  }
  
  return phone;
}

/**
 * 驗證 Email
 */
function validateEmail(email) {
  if (!validator.isEmail(email)) {
    throw new Error('Email 格式不正確');
  }
  
  // 長度限制
  if (email.length > 255) {
    throw new Error('Email 過長');
  }
  
  return email.toLowerCase();
}

/**
 * 驗證姓名
 */
function validateName(name) {
  // 長度檢查
  if (!name || name.length < 2 || name.length > 100) {
    throw new Error('姓名長度必須在 2-100 個字之間');
  }
  
  // 只允許中英文、數字、空格、連字符
  if (!/^[\u4e00-\u9fff\sa-zA-Z0-9\-']+$/.test(name)) {
    throw new Error('姓名包含不允許的字符');
  }
  
  return name.trim();
}

/**
 * 驗證密碼強度
 */
function validatePassword(password) {
  if (password.length < 8) {
    throw new Error('密碼至少 8 個字符');
  }
  
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    throw new Error('密碼需要包含大小寫字母');
  }
  
  if (!/\d/.test(password)) {
    throw new Error('密碼需要包含數字');
  }
  
  return password;
}

/**
 * 防止 XSS：轉義 HTML 字符
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

module.exports = {
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
  sanitizeInput
};
```

#### **在控制器中使用**

```javascript
// backend/src/controllers/driverController.js

const {
  validatePhone,
  validateEmail,
  validateName,
  validatePassword,
  sanitizeInput
} = require('../utils/validators');

async function registerDriver(req, res) {
  try {
    const { phone, email, name, password } = req.body;
    
    // 驗證所有輸入
    const validatedPhone = validatePhone(phone);
    const validatedEmail = validateEmail(email);
    const validatedName = sanitizeInput(validateName(name));
    const validatedPassword = validatePassword(password);
    
    // 檢查是否已存在
    const existing = await checkDriverExists(validatedPhone);
    if (existing) {
      return res.status(409).json({ error: '電話號碼已被使用' });
    }
    
    // 建立司機帳號
    const driver = await createDriver({
      phone: validatedPhone,
      email: validatedEmail,
      name: validatedName,
      password: validatedPassword  // 會被 hash
    });
    
    res.status(201).json({ driver });
  } catch (err) {
    logger.error(`Driver registration error: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { registerDriver };
```

---

## 🔐 第 2 層：認證安全（用戶驗證）

### 2.1 司機身份驗證

#### **多層驗證機制**

```
等級 1：基本驗證
  ✓ 電話號碼
  ✓ 密碼

等級 2：進階驗證
  ✓ OTP（一次性密碼）
  ✓ Email 確認

等級 3：身份驗證
  ✓ 駕照照片
  ✓ 車牌照片
  ✓ 身份証核實（可選）

等級 4：持續驗證
  ✓ 異常登入檢測
  ✓ IP 地址追蹤
  ✓ 裝置指紋
```

#### **驗證流程設計**

```javascript
// backend/src/services/verificationService.js

/**
 * 司機驗證狀態
 */
const VerificationStatus = {
  UNVERIFIED: 'unverified',      // 完全未驗證
  BASIC_VERIFIED: 'basic',       // 已驗證電話
  OTP_VERIFIED: 'otp',           // 已驗證 OTP
  ID_VERIFIED: 'id_verified',    // 已驗證身份
  FULLY_VERIFIED: 'fully'        // 完全驗證
};

/**
 * 根據驗證狀態限制功能
 */
const FeatureLimits = {
  [VerificationStatus.UNVERIFIED]: {
    canBooking: false,
    dailyBookingLimit: 0,
    monthlyBookingLimit: 0,
    needsApprovalPerBooking: true,
    message: '請完成身份驗證才能接受預約'
  },
  [VerificationStatus.BASIC_VERIFIED]: {
    canBooking: true,
    dailyBookingLimit: 5,
    monthlyBookingLimit: 5,
    needsApprovalPerBooking: true,
    message: '基礎功能開放，上傳駕照後可無限接單'
  },
  [VerificationStatus.ID_VERIFIED]: {
    canBooking: true,
    dailyBookingLimit: null,      // 無限制
    monthlyBookingLimit: null,
    needsApprovalPerBooking: false,
    message: '完全驗證，所有功能開放'
  }
};

/**
 * 驗證司機能否執行操作
 */
async function checkCanAcceptBooking(driverId) {
  const driver = await getDriver(driverId);
  const limits = FeatureLimits[driver.verificationStatus];
  
  if (!limits.canBooking) {
    throw new Error(limits.message);
  }
  
  // 檢查每日限制
  if (limits.dailyBookingLimit) {
    const todayBookings = await countTodayBookings(driverId);
    if (todayBookings >= limits.dailyBookingLimit) {
      throw new Error(`已達到今日限制 (${limits.dailyBookingLimit} 筆)`);
    }
  }
  
  return true;
}

module.exports = {
  VerificationStatus,
  FeatureLimits,
  checkCanAcceptBooking
};
```

### 2.2 異常登入檢測

#### **場景：** 同一帳號在 10 分鐘內從台北和高雄登入（物理上不可能）

```javascript
// backend/src/services/securityService.js

const SPEED_OF_TRAVEL = 200;  // km/h (最快速度)

/**
 * 檢測異常登入模式
 */
async function detectAnomalousLogin(driverId, newLocation, newTime) {
  // 取得最近的登入記錄
  const recentLogins = await getRecentLogins(driverId, 60 * 60 * 1000);  // 1 小時內
  
  for (const login of recentLogins) {
    const distance = calculateDistance(login.location, newLocation);
    const timeGap = (newTime - login.time) / 1000 / 60;  // 分鐘
    
    // 計算需要的最少時間
    const requiredTime = (distance / SPEED_OF_TRAVEL) * 60;
    
    if (distance > 50 && timeGap < requiredTime) {
      // 物理上不可能在此時間內到達
      return {
        isAnomalous: true,
        distance,
        timeGap,
        requiredTime,
        reason: `不可能在 ${timeGap} 分鐘內從 ${login.location} 移動 ${distance} km`
      };
    }
  }
  
  return { isAnomalous: false };
}

/**
 * 計算兩個座標的距離
 */
function calculateDistance(location1, location2) {
  const { lat: lat1, lng: lng1 } = location1;
  const { lat: lat2, lng: lng2 } = location2;
  
  const R = 6371;  // 地球半徑（km）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * 異常登入時的處理
 */
async function handleAnomalousLogin(driverId, anomaly) {
  logger.warn(`Anomalous login detected for driver ${driverId}:`, anomaly);
  
  // 發送警告到司機
  await sendLineNotification(driverId, {
    type: 'security_alert',
    message: `偵測到異常登入：${anomaly.reason}。如果這不是你，請立即修改密碼。`,
    action: 'require_2fa'  // 要求二步驗證
  });
  
  // 記錄事件
  await logSecurityEvent({
    driverId,
    eventType: 'anomalous_login',
    details: anomaly,
    timestamp: new Date()
  });
}

module.exports = {
  detectAnomalousLogin,
  handleAnomalousLogin
};
```

### 2.3 二步驗證（2FA）

#### **使用 Supabase 內建 2FA**

```javascript
// backend/src/services/authService.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * 登入流程 - 第 1 步：驗證密碼
 */
async function loginStep1(phone, password) {
  try {
    // 驗證電話 + 密碼
    const driver = await verifyPassword(phone, password);
    
    if (!driver) {
      throw new Error('電話或密碼錯誤');
    }
    
    // 產生臨時 session（未完成 2FA）
    const tempToken = generateTempToken(driver.id, { expiresIn: '5m' });
    
    return {
      status: 'otp_required',
      tempToken,
      message: 'OTP 已發送到您的 LINE'
    };
  } catch (err) {
    logger.error(`Login step 1 error: ${err.message}`);
    throw err;
  }
}

/**
 * 登入流程 - 第 2 步：驗證 OTP
 */
async function loginStep2(tempToken, otp) {
  try {
    // 驗證 tempToken
    const payload = verifyTempToken(tempToken);
    const driverId = payload.id;
    
    // 驗證 OTP
    const isValid = await verifyOTP(driverId, otp);
    if (!isValid) {
      throw new Error('OTP 錯誤或已過期');
    }
    
    // 產生正式的長期 JWT
    const jwtToken = generateJWT(driverId, { expiresIn: '7d' });
    
    // 記錄登入
    await logLogin(driverId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: '2fa'
    });
    
    return {
      status: 'success',
      token: jwtToken,
      message: '登入成功'
    };
  } catch (err) {
    logger.error(`Login step 2 error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  loginStep1,
  loginStep2
};
```

#### **前端登入流程**

```javascript
// frontend/src/pages/DriverLogin.jsx

import { useState } from 'react';

export default function DriverLogin() {
  const [step, setStep] = useState(1);  // 1: 密碼, 2: OTP
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);

  // 步驟 1：提交電話和密碼
  const handleStep1 = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/drivers/auth/login/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      
      const data = await response.json();
      
      if (data.status === 'otp_required') {
        setTempToken(data.tempToken);
        setStep(2);
      } else {
        alert(data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 步驟 2：提交 OTP
  const handleStep2 = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/drivers/auth/login/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // 保存 token
        localStorage.setItem('authToken', data.token);
        // 導向儀表板
        window.location.href = '/driver/dashboard';
      } else {
        alert('OTP 驗證失敗，請重試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {step === 1 ? (
        <div>
          <h2>登入</h2>
          <input
            type="tel"
            placeholder="電話號碼"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleStep1} disabled={loading}>
            {loading ? '驗證中...' : '下一步'}
          </button>
        </div>
      ) : (
        <div>
          <h2>驗證 OTP</h2>
          <p>我們已將驗證碼發送到您的 LINE</p>
          <input
            type="text"
            placeholder="輸入驗證碼"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleStep2} disabled={loading}>
            {loading ? '驗證中...' : '確認登入'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 第 3 層：數據安全

### 3.1 加密敏感資料

#### **在資料庫層加密**

```javascript
// backend/src/services/encryptionService.js

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;  // 32 字元的強密鑰
const ALGORITHM = 'aes-256-cbc';

/**
 * 加密敏感資料
 */
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 將 IV 和加密資料組合
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * 解密敏感資料
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

#### **在 SQL 中使用**

```javascript
// 保存司機時加密敏感欄位

async function saveDriver(driverData) {
  const { encrypt } = require('../services/encryptionService');
  
  const query = `
    INSERT INTO drivers (
      id, phone, email, line_id, name, password_hash
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `;
  
  const encryptedPhone = encrypt(driverData.phone);
  const encryptedLineId = encrypt(driverData.lineId);
  
  await db.query(query, [
    driverData.id,
    encryptedPhone,          // 電話加密
    driverData.email,        // email 不加密（用於登入索引）
    encryptedLineId,         // LINE ID 加密
    driverData.name,
    hashPassword(driverData.password)  // 密碼要 hash 而不是加密
  ]);
}

// 取回司機資料時解密

async function getDriver(driverId) {
  const { decrypt } = require('../services/encryptionService');
  
  const query = 'SELECT * FROM drivers WHERE id = $1';
  const result = await db.query(query, [driverId]);
  
  if (result.rows.length === 0) return null;
  
  const driver = result.rows[0];
  
  return {
    ...driver,
    phone: decrypt(driver.phone),      // 解密
    lineId: decrypt(driver.line_id)    // 解密
  };
}
```

**注意：** 密碼不應該加密，應該 hash。區別：
- **Hash（不可逆）：** 用於密碼，`bcrypt.hash(password)`
- **加密（可逆）：** 用於需要讀取的敏感資料，電話、LINE ID

### 3.2 HTTPS Only

#### **在 Express 中強制 HTTPS**

```javascript
// backend/src/server.js

const express = require('express');
const app = express();

/**
 * 強制 HTTPS
 */
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && 
      process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

/**
 * Helmet：設定安全 HTTP header
 */
const helmet = require('helmet');
app.use(helmet());

app.listen(3000);
```

#### **Cloudflare 自動 HTTPS**

如果用 Cloudflare Pages 和 Workers：
- ✅ 自動免費 HTTPS 憑證
- ✅ 自動 HTTP → HTTPS 重定向
- ✅ 無需額外設定

### 3.3 CORS（跨域資源共享）

#### **只允許妳的前端存取**

```javascript
// backend/src/middleware/cors.js

const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,  // 例：https://yourdomain.com
  credentials: true,                  // 允許 cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * 如果有人試圖從 evil.com 呼叫妳的 API
 * 會被瀏覽器的 CORS 檢查擋掉
 */
```

### 3.4 資料庫級別的安全（RLS）

#### **Supabase Row Level Security**

```sql
-- 司機只能看自己的資料

CREATE POLICY "drivers_select_own" ON drivers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "drivers_update_own" ON drivers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "drivers_delete_own" ON drivers
  FOR DELETE
  USING (auth.uid() = user_id);

-- 司機只能看自己的預約

CREATE POLICY "bookings_drivers_own" ON bookings
  FOR SELECT
  USING (
    driver_id = (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- 客人只能看自己的預約

CREATE POLICY "bookings_customers_own" ON bookings
  FOR SELECT
  USING (
    customer_id = auth.uid()
  );
```

**效果：** 即使駭客繞過應用層的檢查，資料庫層也會再次驗證，防止資料洩露。

---

## 📊 第 4 層：監控 & 檢測

### 4.1 異常行為監控

```javascript
// backend/src/services/monitoringService.js

/**
 * 定義可疑行為模式
 */
const suspiciousPatterns = [
  {
    name: '批量 API 呼叫',
    check: (logs) => logs.filter(l => l.method === 'GET').length > 100 / 5,  // 5 秒內 100+ 個 GET
    severity: 'high',
    action: 'rate_limit'
  },
  {
    name: '登入失敗過多',
    check: (logs) => logs.filter(l => l.action === 'login_failed').length > 5,
    severity: 'high',
    action: 'lock_account'
  },
  {
    name: '大量資料導出',
    check: (logs) => logs.filter(l => l.action === 'export').length > 3,
    severity: 'medium',
    action: 'require_verification'
  },
  {
    name: '批量修改預約',
    check: (logs) => logs.filter(l => l.action === 'update_booking').length > 20 / 60,  // 1 分鐘內 20 個
    severity: 'high',
    action: 'block_action'
  }
];

/**
 * 監控異常活動
 */
async function monitorActivity(userId, action, metadata) {
  // 記錄活動
  const log = await logActivity({
    userId,
    action,
    metadata,
    timestamp: new Date(),
    ip: metadata.ip,
    userAgent: metadata.userAgent
  });
  
  // 檢查可疑模式
  const recentLogs = await getRecentLogs(userId, 5 * 60 * 1000);  // 5 分鐘內
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.check(recentLogs)) {
      await handleSuspiciousActivity(userId, pattern, recentLogs);
    }
  }
}

/**
 * 處理可疑活動
 */
async function handleSuspiciousActivity(userId, pattern, logs) {
  logger.error(`Suspicious activity detected: ${pattern.name} for user ${userId}`);
  
  // 記錄安全事件
  await logSecurityEvent({
    userId,
    eventType: pattern.name,
    severity: pattern.severity,
    details: logs,
    action: pattern.action
  });
  
  // 根據嚴重程度採取行動
  switch (pattern.action) {
    case 'rate_limit':
      // 暫時限制該用戶的請求
      await setRateLimit(userId, { max: 10, windowMs: 60000 });
      break;
    
    case 'lock_account':
      // 鎖定帳號並要求用戶確認
      await lockAccount(userId);
      await sendLineNotification(userId, {
        type: 'security_alert',
        message: '檢測到異常登入嘗試，帳號已被臨時鎖定。請確認是否為本人操作。'
      });
      break;
    
    case 'block_action':
      // 阻止該操作並發警告
      await sendLineNotification(userId, {
        type: 'security_alert',
        message: `檢測到異常操作：${pattern.name}。本操作已被阻止。`
      });
      break;
  }
}

module.exports = { monitorActivity, handleSuspiciousActivity };
```

### 4.2 日誌記錄

```javascript
// backend/src/utils/logger.js

const winston = require('winston');
const fs = require('fs');

// 確保 logs 目錄存在
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'driver-booking-system' },
  transports: [
    // 所有日誌寫入文件
    new winston.transports.File({
      filename: 'logs/all.log',
      maxsize: 10485760,  // 10MB
      maxFiles: 10
    }),
    
    // 錯誤日誌單獨寫入
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 10
    }),
    
    // 安全相關日誌
    new winston.transports.File({
      filename: 'logs/security.log',
      maxsize: 10485760,
      maxFiles: 30
    })
  ]
});

// 開發環境也在控制台輸出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

#### **在各處使用日誌**

```javascript
// 登入成功
logger.info('Driver login', {
  driverId: driver.id,
  ip: req.ip,
  method: '2fa'
});

// 登入失敗
logger.warn('Failed login attempt', {
  phone: req.body.phone,
  ip: req.ip,
  reason: 'invalid_password'
});

// 錯誤
logger.error('Database query failed', {
  query: 'SELECT FROM drivers',
  error: err.message
});

// 安全事件
logger.error('Security alert', {
  eventType: 'anomalous_login',
  userId: driverId,
  details: anomaly
});
```

---

## 🛡️ 第 5 層：法律 & 條款

### 5.1 服務條款安全條款

```markdown
# 服務條款 - 第 X 條 安全與禁止行為

## 用戶責任

用戶同意使用本服務時，不會進行下列任何行為：

1. **未授權存取**
   - 試圖存取未經授權的帳號或資料
   - 進行任何形式的駭客攻擊
   - 掃描系統漏洞（除非書面授權）

2. **注入攻擊**
   - SQL Injection：在輸入欄位插入惡意 SQL 語句
   - XSS 攻擊：注入 JavaScript 程式碼
   - Command Injection：執行系統命令

3. **暴力破解**
   - 自動試 10,000 個密碼組合
   - 大量登入失敗嘗試
   - 分散式帳號嘗試

4. **DDoS 攻擊**
   - 發送大量垃圾請求癱瘓伺服器
   - 使用殭屍網路或其他工具

5. **資料竊取**
   - 盜竊其他用戶的個人資訊
   - 無授權資料導出
   - 社交工程詐騙

6. **冒充與詐騙**
   - 假造身份或冒充他人
   - 建立虛假帳號進行詐騙
   - 虛假預約浪費司機時間

7. **惡意內容**
   - 上傳包含惡意程式的檔案
   - 植入後門或病毒
   - 分發惡意軟體

## 違規後果

違反本條款，本公司有權採取以下措施：

1. **立即暫停或終止服務**
   - 停用帳號（臨時或永久）
   - 刪除所有關聯資料

2. **法律行動**
   - 向警察機關報案
   - 提起民事訴訟追討損害賠償
   - 申請臨時禁制令

3. **其他補救措施**
   - 向相關部門舉報
   - 公開披露違規行為（適當範圍內）

## 漏洞回報

如果妳發現系統安全漏洞，請立即通知我們：

**Email：** security@yourdomain.com  
**回報方式：** 詳細說明漏洞及重現步驟  
**回應時間：** 48 小時內確認收到  

我們承諾：
- ✅ 不會因漏洞回報而起訴
- ✅ 將漏洞保密直到修復
- ✅ 提供漏洞獎勵（見下表）

**漏洞獎勵：**
- 嚴重（資料外洩）：NT$5,000
- 中等（服務中斷）：NT$1,000
- 低等（Minor bug）：NT$100
```

### 5.2 漏洞回報計劃

```
【漏洞回報計劃】

目的：
與安全研究者和白帽駭客合作，持續改進系統安全。

流程：

1. 發現漏洞
   └─ 請勿公開披露

2. 私密通知
   └─ Email: security@yourdomain.com
   └─ 包含：漏洞描述、重現步驟、影響範圍

3. 確認收到（48 小時內）
   └─ 我們會確認漏洞有效性

4. 修復進度
   └─ 提供修復時程表
   └─ 請求回報者暫時保密

5. 修復完成
   └─ 發送確認信
   └─ 支付漏洞獎勵（如適用）
   └─ 感謝函或致謝名單

6. 公開披露
   └─ 修復後 30 天可公開披露
   └─ 與我們協調披露內容

獎勵標準：

[嚴重] (CVSS Score 7-10)
- 遠程代碼執行 (RCE)
- 完整資料庫洩露
- 認證繞過
→ NT$5,000

[中等] (CVSS Score 4-6)
- 部分資料洩露
- 拒絕服務
- 特權提升
→ NT$1,000

[低等] (CVSS Score 0-3)
- 資訊洩露（非敏感）
- UI 問題
- 邏輯漏洞
→ NT$100

注意：
- 無需完成修復即可領獎勵
- 同一漏洞只獎勵第一位回報者
- 歡迎重複回報同一漏洞的其他變體
```

---

## 📋 MVP 階段實踐方案

### 優先級規劃

#### **第 1 週（必做）**

```
優先級 1 - 防護最基本的漏洞
─────────────────────────────

□ 實裝 Parameterized Queries
  └─ 目標：0% SQL Injection 風險
  └─ 預估時間：3-4 小時

□ 所有 API 都要求 JWT 驗證
  └─ 目標：未授權用戶無法存取
  └─ 預估時間：4-5 小時

□ HTTPS Only（Cloudflare 自動）
  └─ 目標：所有通信加密
  └─ 預估時間：0.5 小時（自動）

□ 基本速率限制
  └─ 登入：5 次/5 分鐘
  └─ API：100 次/分鐘
  └─ 預估時間：3-4 小時

□ 輸入驗證
  └─ 檢查欄位格式和長度
  └─ 防止 XSS
  └─ 預估時間：4-5 小時

總計：~15-20 小時（2-3 天）
效果：擋掉 80% 的自動化攻擊
```

#### **第 2-4 週（應做）**

```
優先級 2 - 應對針對性攻擊
─────────────────────────────

□ 司機身份驗證
  └─ 駕照照片 + 車牌核實
  └─ 預估時間：8-10 小時

□ 異常登入檢測
  └─ 同帳號物理上不可能位置登入
  └─ 預估時間：6-8 小時

□ 敏感資料加密
  └─ 電話、LINE ID
  └─ 預估時間：4-6 小時

□ 操作日誌
  └─ 記錄所有登入、修改
  └─ 預估時間：3-4 小時

總計：~21-28 小時（1 週）
效果：應對「針對性」攻擊
```

#### **第 5-12 週（可做）**

```
優先級 3 - 持續強化
─────────────────────────────

□ 二步驗證（2FA）
  └─ LINE / SMS OTP
  └─ 預估時間：6-8 小時

□ 漏洞回報計劃
  └─ 建立 security@domain.com
  └─ 預估時間：2-3 小時

□ 定期安全掃描
  └─ npm audit, Snyk
  └─ 預估時間：1 小時（自動化）

□ 異常行為監控
  └─ 實時告警系統
  └─ 預估時間：8-10 小時

總計：~17-22 小時
效果：長期安全維護
```

---

## ✅ 部署前檢查清單

### 代碼安全檢查

```
□ SQL 查詢
  ☑ 所有 SQL 都使用 Parameterized Queries
  ☑ 無字串拼接（$1, $2, $3 不是 ${variable}）
  ☑ 複雜查詢由 DBA 審查

□ API 驗證
  ☑ 每個 API 都有 authenticateJWT 中間件
  ☑ 每個 API 都有授權檢查（不是所有用戶都能存取所有資源）
  ☑ 司機只能看/改自己的資料

□ 速率限制
  ☑ 登入 API：5 次/5 分鐘
  ☑ 一般 API：100 次/分鐘
  ☑ 預約 API：50 次/小時

□ 輸入驗證
  ☑ 電話號碼：格式 + 長度
  ☑ Email：格式
  ☑ 名字：字符類型 + 長度
  ☑ 密碼：強度 (8+ 字符, 大小寫 + 數字)
  ☑ XSS 防護：轉義特殊字符

□ 密碼安全
  ☑ 使用 bcrypt hash（不是明文或簡單加密）
  ☑ 密碼複雜度檢查
  ☑ 不在日誌中記錄密碼
```

### 部署檢查

```
□ HTTPS
  ☑ 所有流量使用 HTTPS
  ☑ HTTP 自動重定向到 HTTPS
  ☑ 檢查 SSL/TLS 憑證有效期

□ 環境變數
  ☑ JWT_SECRET 安全隨機產生（≥32 字符）
  ☑ DATABASE_URL 不在 Git 中
  ☑ ENCRYPTION_KEY 安全產生
  ☑ 生產環境和開發環境分開

□ 資料庫
  ☑ RLS 已啟用並正確設定
  ☑ 敏感欄位已加密
  ☑ 備份已啟用
  ☑ 存取日誌已啟用

□ 監控
  ☑ 錯誤日誌已設置
  ☑ 安全日誌已設置
  ☑ 日誌定期備份
  ☑ 異常告警已配置

□ 依賴套件
  ☑ npm audit 無高危漏洞
  ☑ 依賴套件版本已鎖定（package-lock.json）
  ☑ 定期更新計劃已建立
```

---

## 💻 代碼實作範本

### 完整的安全認證中間件

```javascript
// backend/src/middlewares/auth.js

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * 驗證 JWT Token
 * 檢查：
 * 1. Token 存在
 * 2. Token 格式正確
 * 3. Token 簽名有效
 * 4. Token 未過期
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`Missing or invalid auth header: ${req.method} ${req.path}`, {
      ip: req.ip,
      authHeader: authHeader ? 'present' : 'missing'
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: '請先登入'
    });
  }
  
  const token = authHeader.substring(7);  // 移除 "Bearer " 前綴
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    logger.debug(`JWT verified for user ${decoded.id}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn(`Token expired for user, attempting refresh`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token 已過期，請重新登入'
      });
    }
    
    logger.error(`JWT verification failed: ${err.message}`, {
      token: token.substring(0, 20) + '...',
      ip: req.ip
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Token 無效'
    });
  }
};

/**
 * 授權檢查：只能存取自己的資源
 */
const authorizeSelfOnly = (req, res, next) => {
  const resourceId = req.params.driverId || req.params.id;
  const userId = req.user.id;
  
  if (!resourceId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '缺少資源 ID'
    });
  }
  
  if (resourceId !== userId) {
    logger.error(`Unauthorized access attempt`, {
      userId,
      attemptedResourceId: resourceId,
      ip: req.ip,
      method: req.method,
      path: req.path
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      message: '無權限存取此資源'
    });
  }
  
  next();
};

/**
 * 授權檢查：只有司機能存取
 */
const authorizeDriverOnly = (req, res, next) => {
  if (req.user.role !== 'driver') {
    logger.warn(`Non-driver attempted to access driver-only API`, {
      userId: req.user.id,
      role: req.user.role,
      ip: req.ip
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      message: '此 API 僅司機可用'
    });
  }
  
  next();
};

module.exports = {
  authenticateJWT,
  authorizeSelfOnly,
  authorizeDriverOnly
};
```

### 完整的登入控制器

```javascript
// backend/src/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const {
  validatePhone,
  validatePassword,
  validateEmail
} = require('../utils/validators');

/**
 * 司機註冊
 */
async function register(req, res) {
  try {
    const { phone, email, name, password } = req.body;
    
    // 驗證輸入
    const validatedPhone = validatePhone(phone);
    const validatedEmail = validateEmail(email);
    const validatedPassword = validatePassword(password);
    
    // 檢查是否已存在
    const existing = await getDriverByPhone(validatedPhone);
    if (existing) {
      logger.warn(`Registration attempt with existing phone: ${validatedPhone}`);
      return res.status(409).json({
        error: 'Conflict',
        message: '此電話號碼已被註冊'
      });
    }
    
    // Hash 密碼
    const passwordHash = await bcrypt.hash(validatedPassword, 10);
    
    // 建立司機
    const driver = await createDriver({
      phone: validatedPhone,
      email: validatedEmail,
      name,
      passwordHash
    });
    
    logger.info(`Driver registered`, {
      driverId: driver.id,
      phone: validatedPhone,
      ip: req.ip
    });
    
    // 產生 JWT
    const token = generateJWT(driver);
    
    res.status(201).json({
      message: '註冊成功',
      driver: {
        id: driver.id,
        phone: driver.phone,
        email: driver.email,
        name: driver.name
      },
      token
    });
  } catch (err) {
    logger.error(`Registration error: ${err.message}`, {
      ip: req.ip
    });
    
    res.status(400).json({
      error: 'Bad Request',
      message: err.message
    });
  }
}

/**
 * 司機登入 - 第 1 步：驗證電話 + 密碼
 */
async function loginStep1(req, res) {
  try {
    const { phone, password } = req.body;
    
    const validatedPhone = validatePhone(phone);
    
    // 取得司機
    const driver = await getDriverByPhone(validatedPhone);
    if (!driver) {
      // 故意延遲，防止時序攻擊
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.warn(`Login failed: user not found`, {
        phone: validatedPhone,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: '電話或密碼錯誤'
      });
    }
    
    // 驗證密碼
    const passwordMatch = await bcrypt.compare(password, driver.passwordHash);
    if (!passwordMatch) {
      logger.warn(`Login failed: invalid password`, {
        driverId: driver.id,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: '電話或密碼錯誤'
      });
    }
    
    // 產生臨時 token（用於 OTP 驗證）
    const tempToken = generateTempToken(driver.id, '5m');
    
    // 發送 OTP 到 LINE
    await sendOTPToLine(driver.lineId);
    
    logger.info(`Login step 1 successful`, {
      driverId: driver.id,
      ip: req.ip
    });
    
    res.json({
      status: 'otp_required',
      tempToken,
      message: '驗證碼已發送到您的 LINE'
    });
  } catch (err) {
    logger.error(`Login step 1 error: ${err.message}`, {
      ip: req.ip
    });
    
    res.status(400).json({
      error: 'Bad Request',
      message: err.message
    });
  }
}

/**
 * 司機登入 - 第 2 步：驗證 OTP
 */
async function loginStep2(req, res) {
  try {
    const { tempToken, otp } = req.body;
    
    // 驗證 tempToken
    const payload = verifyTempToken(tempToken);
    const driverId = payload.id;
    
    // 驗證 OTP
    const isValid = await verifyOTP(driverId, otp);
    if (!isValid) {
      logger.warn(`Login step 2 failed: invalid OTP`, {
        driverId,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'OTP 錯誤或已過期'
      });
    }
    
    // 取得司機資料
    const driver = await getDriver(driverId);
    
    // 產生正式 JWT
    const token = generateJWT(driver);
    
    // 記錄登入
    await logLogin(driverId, {
      method: '2fa',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    logger.info(`Driver login successful`, {
      driverId,
      ip: req.ip
    });
    
    res.json({
      message: '登入成功',
      token,
      driver: {
        id: driver.id,
        phone: driver.phone,
        name: driver.name
      }
    });
  } catch (err) {
    logger.error(`Login step 2 error: ${err.message}`, {
      ip: req.ip
    });
    
    res.status(400).json({
      error: 'Bad Request',
      message: err.message
    });
  }
}

/**
 * 產生 JWT
 */
function generateJWT(driver) {
  return jwt.sign(
    {
      id: driver.id,
      phone: driver.phone,
      role: 'driver'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * 產生臨時 token（用於登入過程）
 */
function generateTempToken(driverId, expiresIn) {
  return jwt.sign(
    { id: driverId },
    process.env.JWT_SECRET + '_TEMP',
    { expiresIn }
  );
}

/**
 * 驗證臨時 token
 */
function verifyTempToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET + '_TEMP');
}

module.exports = {
  register,
  loginStep1,
  loginStep2
};
```

---

## 📈 監控與檢測

### 設置監控指標

```javascript
// backend/src/services/metricsService.js

/**
 * 記錄安全相關指標
 */
const securityMetrics = {
  // 登入嘗試
  loginAttempts: 0,
  loginSuccesses: 0,
  loginFailures: 0,
  
  // API 異常
  apiErrors: 0,
  apiTimeouts: 0,
  unauthorizedAttempts: 0,
  
  // 威脅檢測
  suspiciousActivities: 0,
  blockedRequests: 0,
  
  // 時間追蹤
  lastAnomalyDetected: null,
  anomalyCount24h: 0
};

/**
 * 監控儀表板
 */
async function getSecurityDashboard() {
  return {
    summary: {
      totalUsers: await countUsers(),
      activeUsers24h: await countActiveUsers('24h'),
      suspiciousActivities24h: await countSecurityEvents('24h'),
      blockedRequests24h: await countBlockedRequests('24h')
    },
    
    threats: {
      bruteForceAttempts: await detectBruteForce(),
      suspiciousLogins: await detectSuspiciousLogins(),
      dataAccessPatterns: await analyzeDataAccess()
    },
    
    metrics: {
      avgLoginTime: await calculateAvgLoginTime(),
      apiErrorRate: await calculateErrorRate(),
      unauthorizedAttempts24h: securityMetrics.unauthorizedAttempts
    }
  };
}

module.exports = { getSecurityDashboard, securityMetrics };
```

---

## 🚨 應急響應計劃

### 發現漏洞時的處理流程

```
1. 立即評估（15 分鐘內）
   ├─ 漏洞嚴重性
   ├─ 受影響範圍
   ├─ 是否有證據表示已被利用
   └─ 是否需要立即下線

2. 遏制（1 小時內）
   ├─ 如果被利用：立即禁用相關功能
   ├─ 加強監控：檢查異常活動
   ├─ 備份數據：防止進一步損失
   └─ 準備修復：開始編寫補丁

3. 修復（6-24 小時）
   ├─ 修寫代碼
   ├─ 進行測試
   ├─ 部署修復
   └─ 驗證修復有效

4. 溝通（修復後 24 小時內）
   ├─ 通知用戶（如影響隱私）
   ├─ 感謝漏洞回報者
   ├─ 公開披露（適當範圍）
   └─ 總結與改進

5. 改進（修復後 1 週內）
   ├─ 進行安全審計
   ├─ 檢查是否有類似漏洞
   ├─ 加強防護
   └─ 更新安全政策
```

### 數據外洩時的應對

```
1. 立即行動（1 小時內）
   □ 確認外洩內容
   □ 強制重置所有密碼
   □ 撤銷所有 JWT token
   □ 通知執法部門（如法律要求）

2. 用戶通知（24 小時內）
   □ 發送官方通知
   □ 解釋發生了什麼
   □ 說明用戶應採取的措施
   □ 提供免費監控服務（如適用）

3. 公開聲明（48 小時內）
   □ 官網公告
   □ 社交媒體更新
   □ 新聞稿
   □ 定期更新進展

4. 調查與改進（1-2 週）
   □ 進行法醫分析
   □ 確定根本原因
   □ 實施改進措施
   □ 進行安全審計
```

---

## 📚 最佳實踐總結

### Do ✅

- ✅ 使用 Parameterized Queries
- ✅ 所有 API 都要驗證和授權
- ✅ HTTPS Only
- ✅ 速率限制
- ✅ 輸入驗證
- ✅ 密碼 Hash（bcrypt）
- ✅ 敏感資料加密
- ✅ 詳細日誌
- ✅ 異常監控
- ✅ 定期更新依賴

### Don't ❌

- ❌ 拼接 SQL 字串
- ❌ 相信前端驗證
- ❌ HTTP 明文傳輸
- ❌ 無限制 API 呼叫
- ❌ 明文儲存密碼
- ❌ 忽視日誌
- ❌ 說「我的系統不會被攻擊」
- ❌ 隱瞞安全漏洞
- ❌ 不更新依賴套件
- ❌ 公開 API 金鑰

---

## 🔗 參考資源

- **OWASP Top 10：** https://owasp.org/www-project-top-ten/
- **Parameterized Queries：** https://owasp.org/www-community/attacks/SQL_Injection
- **JWT 安全：** https://tools.ietf.org/html/rfc7519
- **Bcrypt 密碼 Hash：** https://www.npmjs.com/package/bcrypt
- **Helmet.js（HTTP 安全）：** https://helmetjs.github.io/
- **Express Rate Limit：** https://www.npmjs.com/package/express-rate-limit
- **Supabase 安全：** https://supabase.com/docs/guides/security/overview

---

**版本：** v1.0  
**最後更新：** 2026-09-01  
**下次審核：** 2026-12-01  

定期回顧本文檔，確保安全措施與時俱進。
