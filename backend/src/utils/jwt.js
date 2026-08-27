import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// 簽發司機 API token。sub = drivers.id，userId = auth.users.id
export function signDriverToken(driverId, userId) {
  return jwt.sign({ userId }, config.jwt.secret, {
    subject: driverId,
    expiresIn: config.jwt.expiry,
  });
}
