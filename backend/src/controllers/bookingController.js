import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { phoneField, nameField, dateField, timeField } from '../utils/validators.js';
import {
  createBooking,
  getBookingWithDriver,
  respondToBooking,
  quoteBooking,
  respondToQuote,
  searchBookingsByPhone,
} from '../services/bookingService.js';
import { getDriverById } from '../services/driverService.js';
import {
  notifyDriverNewBooking,
  notifyCustomerBookingResult,
  notifyCustomerQuote,
  notifyDriverQuoteResponse,
} from '../services/notificationService.js';
import { bookingItem, bookingCreated, bookingWithDriver, bookingSearchItem } from '../serializers/booking.js';
import { makeBookingToken, verifyBookingToken } from '../utils/bookingToken.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { TRIP_TYPE_VALUES, TRIP_TYPE } from '../constants.js';

const bookingIdParam = z.object({ bookingId: z.string().uuid() });
const tokenQuery = z.object({ token: z.string().min(1, '缺少 token') });

// ── POST /bookings ───────────────────
export const createBookingValidator = validate({
  body: z
    .object({
      driverId: z.string().uuid('driverId 需為 UUID'),
      customerName: nameField,
      customerPhone: phoneField,
      customerLineId: z.string().trim().max(100).optional(),
      tripType: z
        .string()
        .refine((v) => TRIP_TYPE_VALUES.includes(v), '無效的 tripType')
        .default(TRIP_TYPE.ONE_WAY),
      pickupLocation: z.string().trim().min(1).max(200),
      destination: z.string().trim().min(1).max(200),
      bookingDate: dateField,
      bookingTime: timeField,
      returnDate: dateField.optional(),
      returnTime: timeField.optional(),
      passengerCount: z.coerce.number().int().min(1).max(20).default(1),
      specialRequests: z.string().trim().max(2000).optional(),
      estimatedDistanceKm: z.coerce.number().nonnegative().max(2000).optional(),
    })
    .strict()
    .refine(
      (v) => v.tripType !== TRIP_TYPE.ROUND_TRIP || (v.returnDate && v.returnTime),
      { message: '往返行程需填寫回程日期與時間', path: ['returnDate'] },
    ),
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

// ── GET /bookings/search?phone= ──（乘客用手機查詢行程，公開）
export const searchValidator = validate({
  query: z.object({ phone: phoneField }),
});

export const searchByPhone = asyncHandler(async (req, res) => {
  const rows = await searchBookingsByPhone(req.query.phone);
  res.json({
    bookings: rows.map((row) => bookingSearchItem(row, makeBookingToken(row.id))),
  });
});

// ── GET /bookings/:bookingId?token= ──
export const getStatusValidator = validate({ params: bookingIdParam, query: tokenQuery });

export const getStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!verifyBookingToken(bookingId, req.query.token)) {
    throw ApiError.forbidden('token 無效');
  }
  const row = await getBookingWithDriver(bookingId);
  res.json({ booking: bookingWithDriver(row) });
});

// ── PUT /bookings/:bookingId/accept ──（司機）
export const acceptValidator = validate({ params: bookingIdParam });

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

// ── PUT /bookings/:bookingId/reject ──（司機）
export const rejectValidator = validate({
  params: bookingIdParam,
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

// ── PUT /bookings/:bookingId/quote ──（司機重新報價）
export const quoteValidator = validate({
  params: bookingIdParam,
  body: z
    .object({
      price: z.coerce.number().positive('報價需大於 0').max(1_000_000),
      note: z.string().trim().max(500).optional(),
    })
    .strict(),
});

export const quote = asyncHandler(async (req, res) => {
  const booking = await quoteBooking(req.params.bookingId, req.auth.driverId, {
    price: req.body.price,
    note: req.body.note,
  });
  const driver = await getDriverById(booking.driver_id);
  const notify = await notifyCustomerQuote(booking, driver).catch((e) => {
    logger.error('notifyCustomerQuote 例外', e);
    return { ok: false, channel: 'none' };
  });
  res.json({
    booking: bookingItem(booking),
    message: notify.ok ? `報價已透過 ${notify.channel} 通知客人` : '報價已送出（客人通知發送失敗或未設定）',
  });
});

// ── PUT /bookings/:bookingId/quote/accept|decline ──（客人，需 token）
export const quoteResponseValidator = validate({ params: bookingIdParam, query: tokenQuery });

function makeQuoteResponder(accept) {
  return asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    if (!verifyBookingToken(bookingId, req.query.token)) {
      throw ApiError.forbidden('token 無效');
    }
    const booking = await respondToQuote(bookingId, { accept });
    const driver = await getDriverById(booking.driver_id);
    const notify = await notifyDriverQuoteResponse(booking, driver, { accepted: accept }).catch((e) => {
      logger.error('notifyDriverQuoteResponse 例外', e);
      return { ok: false, channel: 'none' };
    });
    res.json({
      booking: bookingWithDriver({ ...booking, drivers: driver }),
      message: notify.ok
        ? `已通知司機（${notify.channel}）`
        : accept
          ? '已同意報價（司機通知發送失敗或未設定）'
          : '已取消預約（司機通知發送失敗或未設定）',
    });
  });
}

export const quoteAccept = makeQuoteResponder(true);
export const quoteDecline = makeQuoteResponder(false);
