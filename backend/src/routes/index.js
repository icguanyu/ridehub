// 掛載所有 /api/v1 路由。
import { Router } from 'express';
import { healthRouter } from './health.js';
import { driversRouter } from './drivers.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/drivers', driversRouter);

// 後續步驟會補上：
//   apiRouter.use('/bookings', bookingsRouter);  // Step 5-6
