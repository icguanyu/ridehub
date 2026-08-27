import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { registerDriver, loginDriver } from '../services/authService.js';
import { driverSummary, driverPrivate } from '../serializers/driver.js';
import { nameField, phoneField, emailField, passwordField } from '../utils/validators.js';

export const registerValidator = validate({
  body: z.object({
    name: nameField,
    phone: phoneField,
    email: emailField,
    password: passwordField,
  }),
});

export const loginValidator = validate({
  body: z.object({
    phone: phoneField,
    password: z.string().min(1),
  }),
});

export const register = asyncHandler(async (req, res) => {
  const { driver, token } = await registerDriver(req.body);
  res.status(201).json({ driver: driverSummary(driver), token });
});

export const login = asyncHandler(async (req, res) => {
  const { driver, token, supabase } = await loginDriver(req.body);
  res.json({ driver: driverPrivate(driver), token, supabase });
});
