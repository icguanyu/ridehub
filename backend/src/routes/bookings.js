import { Router } from 'express';
import { requireDriverAuth } from '../middlewares/auth.js';
import {
  create,
  createBookingValidator,
  getStatus,
  getStatusValidator,
  accept,
  acceptValidator,
  reject,
  rejectValidator,
} from '../controllers/bookingController.js';

export const bookingsRouter = Router();

// 客人匿名建立預約
bookingsRouter.post('/', createBookingValidator, create);

// 客人憑 token 查詢預約狀態
bookingsRouter.get('/:bookingId', getStatusValidator, getStatus);

// 司機接受 / 拒絕（需登入）
bookingsRouter.put('/:bookingId/accept', requireDriverAuth, acceptValidator, accept);
bookingsRouter.put('/:bookingId/reject', requireDriverAuth, rejectValidator, reject);
