// 前端圖片壓縮：縮到最長邊 maxDim、逐步降品質，壓到 targetBytes 以下。
// 用於大頭貼上傳 —— 不要把使用者的原圖（可能好幾 MB）直接送到後端。

async function loadImageSource(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* 某些瀏覽器不支援選項，改用 <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('圖片轉檔失敗'))),
      type,
      quality,
    );
  });
}

export async function compressImage(
  file,
  { maxDim = 512, targetBytes = 300 * 1024, minQuality = 0.4, type = 'image/jpeg' } = {},
) {
  const src = await loadImageSource(file);
  const w0 = src.width;
  const h0 = src.height;
  const scale = Math.min(1, maxDim / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0, width, height);
  if (typeof src.close === 'function') src.close();

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, type, quality);
  while (blob.size > targetBytes && quality > minQuality) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await canvasToBlob(canvas, type, quality);
  }

  const ext = type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `avatar.${ext}`, { type: blob.type || type });
}
