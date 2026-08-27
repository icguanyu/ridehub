// 用 zod schema 驗證 req 的指定部位（body / query / params）。
// 驗證通過後，把「解析後」的值寫回 req，方便 controller 直接取用。
import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (schemas[key]) {
        req[key] = schemas[key].parse(req[key]);
      }
    }
    next();
  } catch (err) {
    if (err?.name === 'ZodError') {
      return next(ApiError.badRequest('欄位驗證失敗', err.flatten().fieldErrors));
    }
    next(err);
  }
};
