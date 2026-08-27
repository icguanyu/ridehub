import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/index.js';

export const healthRouter = Router();

// 基本存活檢查
healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, service: 'ridehub-backend', env: config.env, time: new Date().toISOString() });
});

// 深度檢查：確認能連到 Supabase
healthRouter.get(
  '/db',
  asyncHandler(async (_req, res) => {
    const { error } = await supabaseAdmin.from('drivers').select('id', { count: 'exact', head: true });
    if (error) {
      return res.status(503).json({ ok: false, db: 'error', message: error.message });
    }
    res.json({ ok: true, db: 'connected' });
  }),
);
