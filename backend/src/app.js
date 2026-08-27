import { readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { makeCorsOrigin } from './utils/corsOrigin.js';

const openapiDoc = YAML.parse(
  readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'),
);

export function createApp() {
  const app = express();

  // API 文件（掛在 helmet 之前，避免 CSP 擋掉 Swagger UI 的資源）
  app.get('/api/v1/openapi.json', (_req, res) => res.json(openapiDoc));
  app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiDoc, { customSiteTitle: 'RideHub API' }),
  );

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

  app.get('/', (_req, res) => res.json({ service: 'ridehub-backend', docs: '/api/v1/docs' }));
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
