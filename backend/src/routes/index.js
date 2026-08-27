// 掛載所有 /api/v1 路由。
import { Router } from 'express';
import { healthRouter } from './health.js';
import { driversRouter } from './drivers.js';
import { bookingsRouter } from './bookings.js';
import { lineRouter } from './line.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/drivers', driversRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/line', lineRouter);
