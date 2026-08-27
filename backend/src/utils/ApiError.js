// 統一的 API 錯誤物件。丟出後由 errorHandler 轉成 JSON 回應。
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(msg = '請求格式錯誤', details) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = '未授權') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = '沒有權限') {
    return new ApiError(403, msg);
  }

  static notFound(msg = '找不到資源') {
    return new ApiError(404, msg);
  }

  static conflict(msg = '資料衝突') {
    return new ApiError(409, msg);
  }
}
