// 包住 async route handler，讓拋出的錯誤自動進入 Express error middleware。
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
