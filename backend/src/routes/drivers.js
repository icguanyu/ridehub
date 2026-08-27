import { Router } from 'express';
import {
  register,
  registerValidator,
  login,
  loginValidator,
} from '../controllers/authController.js';

export const driversRouter = Router();

// ── 認證 ──────────────────────────────
driversRouter.post('/auth/register', registerValidator, register);
driversRouter.post('/auth/login', loginValidator, login);

// ── 司機資料 / 時間 / 預約 / 統計 ──────
// Step 4 會補上：
//   GET  /:driverId
//   PUT  /:driverId
//   POST /:driverId/bind-line
//   GET/PUT /:driverId/availability
//   GET  /:driverId/bookings
//   GET  /:driverId/stats
