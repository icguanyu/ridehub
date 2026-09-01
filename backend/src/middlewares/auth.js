// 驗證司機登入後取得的 JWT（由本後端於 /drivers/auth/login 簽發）。
// 通過後 req.auth = { driverId, userId }。
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';

export const requireDriverAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized('缺少授權 token'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.auth = { driverId: payload.sub, userId: payload.userId };
    next();
  } catch {
    next(ApiError.unauthorized('token 無效或已過期'));
  }
};

// 確認網址上的 :driverId 就是登入者本人。
export const requireSelf = (req, _res, next) => {
  if (req.params.driverId && req.params.driverId !== req.auth?.driverId) {
    return next(ApiError.forbidden('只能存取自己的資料'));
  }
  next();
};

// 驗證 superadmin token（/admin/auth/login 簽發，role=admin）。
export const requireAdmin = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(ApiError.unauthorized('缺少授權 token'));
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (payload.role !== 'admin') return next(ApiError.forbidden('需要 admin 權限'));
    req.admin = { email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('token 無效或已過期'));
  }
};
