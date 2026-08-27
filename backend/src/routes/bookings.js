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
  quote,
  quoteValidator,
  quoteAccept,
  quoteDecline,
  quoteResponseValidator,
} from '../controllers/bookingController.js';

export const bookingsRouter = Router();

// 客人匿名建立預約
bookingsRouter.post('/', createBookingValidator, create);

// 客人憑 token 查詢預約狀態
bookingsRouter.get('/:bookingId', getStatusValidator, getStatus);

// 客人回應司機報價（需 token）
bookingsRouter.put('/:bookingId/quote/accept', quoteResponseValidator, quoteAccept);
bookingsRouter.put('/:bookingId/quote/decline', quoteResponseValidator, quoteDecline);

// 司機接受 / 拒絕 / 重新報價（需登入）
bookingsRouter.put('/:bookingId/accept', requireDriverAuth, acceptValidator, accept);
bookingsRouter.put('/:bookingId/reject', requireDriverAuth, rejectValidator, reject);
bookingsRouter.put('/:bookingId/quote', requireDriverAuth, quoteValidator, quote);
