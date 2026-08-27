import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { makeCorsOrigin } from './utils/corsOrigin.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins.length ? makeCorsOrigin(config.corsOrigins) : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.isProd ? 'combined' : 'dev'));

  app.get('/', (_req, res) => res.json({ service: 'ridehub-backend', docs: '/api/v1/health' }));
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
