import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { phoneField, nameField, dateField, timeField } from '../utils/validators.js';
import {
  createBooking,
  getBookingWithDriver,
  respondToBooking,
} from '../services/bookingService.js';
import { getDriverById } from '../services/driverService.js';
import {
  notifyDriverNewBooking,
  notifyCustomerBookingResult,
} from '../services/notificationService.js';
import { bookingItem, bookingCreated, bookingWithDriver } from '../serializers/booking.js';
import { makeBookingToken, verifyBookingToken } from '../utils/bookingToken.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// ── POST /bookings ───────────────────
export const createBookingValidator = validate({
  body: z
    .object({
      driverId: z.string().uuid('driverId 需為 UUID'),
      customerName: nameField,
      customerPhone: phoneField,
      customerLineId: z.string().trim().max(100).optional(),
      pickupLocation: z.string().trim().min(1).max(200),
      destination: z.string().trim().min(1).max(200),
      bookingDate: dateField,
      bookingTime: timeField,
      passengerCount: z.coerce.number().int().min(1).max(20).default(1),
      specialRequests: z.string().trim().max(2000).optional(),
      estimatedDistanceKm: z.coerce.number().nonnegative().max(2000).optional(),
    })
    .strict(),
});

export const create = asyncHandler(async (req, res) => {
  const { booking, driver } = await createBooking(req.body);

  // 通知司機（失敗不影響預約建立）
  const notify = await notifyDriverNewBooking(driver, booking).catch((e) => {
    logger.error('notifyDriverNewBooking 例外', e);
    return { ok: false, channel: 'none' };
  });

  res.status(201).json({
    booking: {
      ...bookingCreated(booking),
      statusToken: makeBookingToken(booking.id),
      message: '預約已提交，等待司機確認',
    },
    notified: notify.ok ? notify.channel : false,
  });
});

// ── GET /bookings/:bookingId?token= ──
export const getStatusValidator = validate({
  params: z.object({ bookingId: z.string().uuid() }),
  query: z.object({ token: z.string().min(1, '缺少 token') }),
});

export const getStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!verifyBookingToken(bookingId, req.query.token)) {
    throw ApiError.forbidden('token 無效');
  }
  const row = await getBookingWithDriver(bookingId);
  res.json({ booking: bookingWithDriver(row) });
});

// ── PUT /bookings/:bookingId/accept ──
export const acceptValidator = validate({
  params: z.object({ bookingId: z.string().uuid() }),
});

export const accept = asyncHandler(async (req, res) => {
  const booking = await respondToBooking(req.params.bookingId, req.auth.driverId, { accept: true });
  const driver = await getDriverById(booking.driver_id);
  const notify = await notifyCustomerBookingResult(booking, driver, { accepted: true }).catch((e) => {
    logger.error('notifyCustomer 例外', e);
    return { ok: false, channel: 'none' };
  });
  res.json({
    booking: bookingItem(booking),
    message: notify.ok ? `已透過 ${notify.channel} 通知客人` : '已接受（客人通知發送失敗或未設定）',
  });
});

// ── PUT /bookings/:bookingId/reject ──
export const rejectValidator = validate({
  params: z.object({ bookingId: z.string().uuid() }),
  body: z.object({ reason: z.string().trim().max(500).optional() }).strict(),
});

export const reject = asyncHandler(async (req, res) => {
  const booking = await respondToBooking(req.params.bookingId, req.auth.driverId, {
    accept: false,
    reason: req.body.reason,
  });
  const driver = await getDriverById(booking.driver_id);
  const notify = await notifyCustomerBookingResult(booking, driver, {
    accepted: false,
    reason: req.body.reason,
  }).catch((e) => {
    logger.error('notifyCustomer 例外', e);
    return { ok: false, channel: 'none' };
  });
  res.json({
    booking: bookingItem(booking),
    message: notify.ok ? `已透過 ${notify.channel} 通知客人` : '已拒絕（客人通知發送失敗或未設定）',
  });
});
