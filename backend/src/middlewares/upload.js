import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MB = 1024 * 1024;

// 產生一個限定大小的單檔上傳中介層（記憶體暫存，欄位名固定 "file"）。
// Cloud Run 沒有可寫磁碟，所以用 memoryStorage。
export function imageUpload({ maxBytes = 5 * MB } = {}) {
  const single = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
      cb(ApiError.badRequest('只接受 JPG / PNG / WebP 圖片'));
    },
  }).single('file');

  const limitMb = Math.round((maxBytes / MB) * 10) / 10;

  return (req, res, next) => {
    single(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest(`圖片不可超過 ${limitMb}MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(ApiError.badRequest('一次只能上傳一張圖片'));
        }
        return next(ApiError.badRequest(`上傳失敗：${err.message}`));
      }
      if (err) return next(err);
      next();
    });
  };
}

// 通用（證件掃描等可放寬）
export const uploadImage = imageUpload();

// 大頭貼：前端已壓縮到 ~300KB，這裡 1MB 純粹擋「跳過前端直接打 API」。
export const uploadAvatar = imageUpload({ maxBytes: 1 * MB });
