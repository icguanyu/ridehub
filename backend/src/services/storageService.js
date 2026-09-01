import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

// 公開 bucket：司機大頭貼。客人端頁面直接以公開 URL 顯示。
// 驗證證件之後會用另一個「私有」bucket，不要混用。
const AVATAR_BUCKET = 'driver-avatars';

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// file 為 multer 的記憶體檔案物件：{ buffer, mimetype, size, ... }
export async function uploadDriverAvatar(driverId, file) {
  const ext = EXT_BY_MIME[file.mimetype] ?? 'jpg';
  // 檔名帶時間戳 → 換圖後 URL 會變，避免 CDN / 瀏覽器讀到舊快取。
  const path = `${driverId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new ApiError(500, `大頭貼上傳失敗：${error.message}`);
  return path;
}

// 刪舊圖，失敗不阻斷主流程（頂多留下孤兒檔）。
export async function removeStoredFile(path) {
  if (!path) return;
  try {
    await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([path]);
  } catch {
    /* 忽略 */
  }
}

// 由相對路徑組出公開 URL（純字串組合，不打網路）。
export function avatarPublicUrl(path) {
  if (!path) return null;
  return supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}
