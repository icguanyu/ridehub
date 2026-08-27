import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🚗 RideHub API 已啟動 → http://localhost:${config.port} (${config.env})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    logger.info(`${sig} 收到，關閉伺服器…`);
    server.close(() => process.exit(0));
  });
}
