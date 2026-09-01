import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { BOOKING_STATUS_VALUES } from '../constants.js';
import {
  adminLogin,
  getOverview,
  listDrivers,
  getDriverDetail,
  listAllBookings,
  setDriverVerified,
  setDriverSuspended,
} from '../services/adminService.js';

const monthParam = z.string().regex(/^\d{4}-\d{2}$/, 'month 格式需為 YYYY-MM').optional();
const driverIdParam = z.object({ driverId: z.string().uuid() });

// ── POST /admin/auth/login ──
export const loginValidator = validate({
  body: z.object({ email: z.string().email(), password: z.string().min(1) }).strict(),
});
export const login = asyncHandler(async (req, res) => {
  res.json(await adminLogin(req.body));
});

// ── GET /admin/overview ──
export const overviewValidator = validate({ query: z.object({ month: monthParam }) });
export const overview = asyncHandler(async (req, res) => {
  res.json(await getOverview(req.query.month || undefined));
});

// ── GET /admin/drivers ──
export const listDriversValidator = validate({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
export const drivers = asyncHandler(async (req, res) => {
  res.json(await listDrivers(req.query));
});

// ── GET /admin/drivers/:driverId ──
export const driverDetailValidator = validate({ params: driverIdParam });
export const driverDetail = asyncHandler(async (req, res) => {
  res.json(await getDriverDetail(req.params.driverId));
});

// ── GET /admin/bookings ──
export const listBookingsValidator = validate({
  query: z.object({
    status: z.string().refine((v) => BOOKING_STATUS_VALUES.includes(v), '無效的 status').optional(),
    driverId: z.string().uuid().optional(),
    month: monthParam,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
export const bookings = asyncHandler(async (req, res) => {
  res.json(await listAllBookings(req.query));
});

// ── PUT /admin/drivers/:driverId/verify ──
export const verifyValidator = validate({
  params: driverIdParam,
  body: z.object({ verified: z.boolean() }).strict(),
});
export const verify = asyncHandler(async (req, res) => {
  res.json(await setDriverVerified(req.params.driverId, req.body.verified, req.admin.email));
});

// ── PUT /admin/drivers/:driverId/suspend ──
export const suspendValidator = validate({
  params: driverIdParam,
  body: z.object({ suspended: z.boolean(), reason: z.string().trim().max(500).optional() }).strict(),
});
export const suspend = asyncHandler(async (req, res) => {
  res.json(
    await setDriverSuspended(req.params.driverId, req.body.suspended, req.body.reason, req.admin.email),
  );
});
