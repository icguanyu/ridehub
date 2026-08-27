import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { phoneField, nameField, dateField, timeField } from '../utils/validators.js';
import { createBooking, getBookingWithDriver } from '../services/bookingService.js';
import { bookingCreated, bookingWithDriver } from '../serializers/booking.js';
import { makeBookingToken, verifyBookingToken } from '../utils/bookingToken.js';
import { ApiError } from '../utils/ApiError.js';

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
  const { booking } = await createBooking(req.body);
  res.status(201).json({
    booking: {
      ...bookingCreated(booking),
      statusToken: makeBookingToken(booking.id),
      message: '預約已提交，等待司機確認',
    },
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
