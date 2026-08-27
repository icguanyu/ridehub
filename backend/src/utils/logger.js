// 極簡 logger，之後可換成 pino。
const ts = () => new Date().toISOString();

export const logger = {
  info: (...a) => console.log(`[${ts()}] INFO`, ...a),
  warn: (...a) => console.warn(`[${ts()}] WARN`, ...a),
  error: (...a) => console.error(`[${ts()}] ERROR`, ...a),
};
