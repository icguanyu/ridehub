import { Router } from 'express';
import {
  register,
  registerValidator,
  login,
  loginValidator,
} from '../controllers/authController.js';
import { requireDriverAuth, requireSelf } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import {
  getMe,
  updateProfile,
  updateProfileValidator,
  bindLine,
  bindLineValidator,
  getAvailabilityHandler,
  updateAvailabilityHandler,
  updateAvailabilityValidator,
  listBookings,
  listBookingsValidator,
  getStats,
  getStatsValidator,
  getPublicProfile,
  distancePreview,
  distancePreviewValidator,
} from '../controllers/driverController.js';
import { createLinkCode } from '../controllers/lineController.js';
import {
  createDriverBookingHandler,
  createDriverBookingValidator,
} from '../controllers/bookingController.js';

export const driversRouter = Router();

// ── 認證（公開）──────────────────────
driversRouter.post('/auth/register', authLimiter, registerValidator, register);
driversRouter.post('/auth/login', authLimiter, loginValidator, login);

// ── 公開：客人端顯示司機資訊（須在下方 auth 守衛之前）──
driversRouter.get('/:driverId/public', getPublicProfile);

// ── 以下皆需登入，且只能操作自己的 driverId ──
driversRouter.use('/:driverId', requireDriverAuth, requireSelf);

driversRouter.get('/:driverId', getMe);
driversRouter.put('/:driverId', updateProfileValidator, updateProfile);

driversRouter.post('/:driverId/bind-line', bindLineValidator, bindLine);
driversRouter.post('/:driverId/line/link-code', createLinkCode);

driversRouter.get('/:driverId/availability', getAvailabilityHandler);
driversRouter.put('/:driverId/availability', updateAvailabilityValidator, updateAvailabilityHandler);

driversRouter.get('/:driverId/bookings', listBookingsValidator, listBookings);
driversRouter.post('/:driverId/bookings', createDriverBookingValidator, createDriverBookingHandler);
driversRouter.post('/:driverId/distance', distancePreviewValidator, distancePreview);
driversRouter.get('/:driverId/stats', getStatsValidator, getStats);
