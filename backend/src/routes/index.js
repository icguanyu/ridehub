// 掛載所有 /api/v1 路由。
import { Router } from 'express';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

// 後續步驟會補上：
//   apiRouter.use('/drivers', driversRouter);   // Step 3-4
//   apiRouter.use('/bookings', bookingsRouter);  // Step 5-6
