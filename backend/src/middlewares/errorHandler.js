import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// 404
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`找不到路由：${req.method} ${req.originalUrl}`));
};

// 統一錯誤回應
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(err.stack || err);
  }

  // details 只在「自家的 4xx（例如 Zod 驗證錯誤）」或非正式環境才回傳，
  // 避免 500 時把 Supabase / PostgREST 的內部欄位、關聯名稱洩漏出去。
  const exposeDetails = err.details && (statusCode < 500 || !config.isProd);

  res.status(statusCode).json({
    error: {
      message: isApiError || statusCode < 500 ? err.message : '伺服器發生錯誤',
      ...(exposeDetails ? { details: err.details } : {}),
      ...(config.isProd ? {} : { stack: err.stack }),
    },
  });
};
