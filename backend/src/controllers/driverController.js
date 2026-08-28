import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { nameField } from '../utils/validators.js';
import { currentMonth } from '../utils/dates.js';
import { BOOKING_STATUS_VALUES } from '../constants.js';
import {
  getDriverById,
  updateDriver,
  bindLineId,
  getAvailability,
  updateAvailability,
} from '../services/driverService.js';
import { listDriverBookings } from '../services/bookingService.js';
import { getDriverStats } from '../services/statsService.js';
import { driverPrivate, driverPublic } from '../serializers/driver.js';
import { bookingItem } from '../serializers/booking.js';

const monthParam = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'month 格式需為 YYYY-MM')
  .optional();

// ── GET /drivers/:driverId ────────────
export const getMe = asyncHandler(async (req, res) => {
  const driver = await getDriverById(req.params.driverId);
  res.json(driverPrivate(driver));
});

// ── GET /drivers/:driverId/public（無需登入）──
export const getPublicProfile = asyncHandler(async (req, res) => {
  const driver = await getDriverById(req.params.driverId);
  res.json(driverPublic(driver));
});

// ── PUT /drivers/:driverId ────────────
export const updateProfileValidator = validate({
  body: z
    .object({
      name: nameField.optional(),
      serviceDescription: z.string().max(2000).nullish(),
      serviceAreas: z.string().max(500).nullish(),
      carType: z.string().max(50).nullish(),
      carPlate: z.string().max(20).nullish(),
      basePrice: z.number().nonnegative().nullish(),
      pricePerKm: z.number().nonnegative().nullish(),
      lineDisplayId: z.string().trim().max(100).nullish(),
    })
    .strict(),
});

const PROFILE_FIELD_MAP = {
  name: 'name',
  serviceDescription: 'service_description',
  serviceAreas: 'service_areas',
  carType: 'car_type',
  carPlate: 'car_plate',
  basePrice: 'base_price',
  pricePerKm: 'price_per_km',
  lineDisplayId: 'line_display_id',
};

export const updateProfile = asyncHandler(async (req, res) => {
  const patch = {};
  for (const [k, col] of Object.entries(PROFILE_FIELD_MAP)) {
    if (req.body[k] !== undefined) patch[col] = req.body[k];
  }
  const driver = await updateDriver(req.params.driverId, patch);
  res.json(driverPrivate(driver));
});

// ── POST /drivers/:driverId/bind-line ─
export const bindLineValidator = validate({
  body: z.object({ lineId: z.string().trim().min(1).max(100) }),
});

export const bindLine = asyncHandler(async (req, res) => {
  await bindLineId(req.params.driverId, req.body.lineId);
  res.json({ success: true });
});

// ── GET /drivers/:driverId/availability
export const getAvailabilityHandler = asyncHandler(async (req, res) => {
  res.json(await getAvailability(req.params.driverId));
});

// ── PUT /drivers/:driverId/availability
export const updateAvailabilityValidator = validate({
  body: z
    .object({
      maxDailyBookings: z.number().int().min(1).max(100).optional(),
    })
    .strict(),
});

export const updateAvailabilityHandler = asyncHandler(async (req, res) => {
  const result = await updateAvailability(req.params.driverId, req.body);
  res.json(result);
});

// ── GET /drivers/:driverId/bookings ───
export const listBookingsValidator = validate({
  query: z.object({
    status: z.string().refine((v) => BOOKING_STATUS_VALUES.includes(v), '無效的 status').optional(),
    month: monthParam,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const listBookings = asyncHandler(async (req, res) => {
  const { status, month, page, pageSize } = req.query;
  const { rows, pagination } = await listDriverBookings(req.params.driverId, {
    status,
    month,
    page,
    pageSize,
  });
  res.json({ bookings: rows.map(bookingItem), pagination });
});

// ── GET /drivers/:driverId/stats ──────
export const getStatsValidator = validate({
  query: z.object({ month: monthParam }),
});

export const getStats = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  res.json(await getDriverStats(req.params.driverId, month));
});
