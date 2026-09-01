import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import {
  login,
  loginValidator,
  overview,
  overviewValidator,
  drivers,
  listDriversValidator,
  driverDetail,
  driverDetailValidator,
  bookings,
  listBookingsValidator,
  verify,
  verifyValidator,
  suspend,
  suspendValidator,
  verifications,
  reviewVerificationValidator,
  reviewVerificationHandler,
} from '../controllers/adminController.js';

export const adminRouter = Router();

adminRouter.post('/auth/login', authLimiter, loginValidator, login);

adminRouter.use(requireAdmin);

adminRouter.get('/overview', overviewValidator, overview);
adminRouter.get('/drivers', listDriversValidator, drivers);
adminRouter.get('/drivers/:driverId', driverDetailValidator, driverDetail);
adminRouter.put('/drivers/:driverId/verify', verifyValidator, verify);
adminRouter.put('/drivers/:driverId/suspend', suspendValidator, suspend);
adminRouter.get('/bookings', listBookingsValidator, bookings);

adminRouter.get('/verifications', verifications);
adminRouter.put('/verifications/:id', reviewVerificationValidator, reviewVerificationHandler);
