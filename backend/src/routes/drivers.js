import { Router } from 'express';
import {
  register,
  registerValidator,
  login,
  loginValidator,
} from '../controllers/authController.js';
import { requireDriverAuth, requireSelf } from '../middlewares/auth.js';
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
} from '../controllers/driverController.js';

export const driversRouter = Router();

// ── 認證（公開）──────────────────────
driversRouter.post('/auth/register', registerValidator, register);
driversRouter.post('/auth/login', loginValidator, login);

// ── 以下皆需登入，且只能操作自己的 driverId ──
driversRouter.use('/:driverId', requireDriverAuth, requireSelf);

driversRouter.get('/:driverId', getMe);
driversRouter.put('/:driverId', updateProfileValidator, updateProfile);

driversRouter.post('/:driverId/bind-line', bindLineValidator, bindLine);

driversRouter.get('/:driverId/availability', getAvailabilityHandler);
driversRouter.put('/:driverId/availability', updateAvailabilityValidator, updateAvailabilityHandler);

driversRouter.get('/:driverId/bookings', listBookingsValidator, listBookings);
driversRouter.get('/:driverId/stats', getStatsValidator, getStats);
