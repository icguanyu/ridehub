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
  cancel,
  cancelValidator,
  complete,
  completeValidator,
  searchValidator,
  searchByPhone,
} from '../controllers/bookingController.js';

export const bookingsRouter = Router();

// 客人匿名建立預約
bookingsRouter.post('/', createBookingValidator, create);

// 乘客用手機查詢行程（需在 /:bookingId 之前）
bookingsRouter.get('/search', searchValidator, searchByPhone);

// 客人憑 token 查詢預約狀態
bookingsRouter.get('/:bookingId', getStatusValidator, getStatus);

// 客人回應司機報價（需 token）
bookingsRouter.put('/:bookingId/quote/accept', quoteResponseValidator, quoteAccept);
bookingsRouter.put('/:bookingId/quote/decline', quoteResponseValidator, quoteDecline);

// 司機接受 / 拒絕 / 重新報價 / 取消 / 標記完成（需登入）
bookingsRouter.put('/:bookingId/accept', requireDriverAuth, acceptValidator, accept);
bookingsRouter.put('/:bookingId/reject', requireDriverAuth, rejectValidator, reject);
bookingsRouter.put('/:bookingId/quote', requireDriverAuth, quoteValidator, quote);
bookingsRouter.put('/:bookingId/cancel', requireDriverAuth, cancelValidator, cancel);
bookingsRouter.put('/:bookingId/complete', requireDriverAuth, completeValidator, complete);
