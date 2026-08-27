// 依 CORS_ORIGINS 產生 cors() 的 origin 檢查函式。
// 支援：
//   - 完全比對：           https://ridehub-2h3.pages.dev
//   - 萬用子網域（*.）：    https://*.ridehub-2h3.pages.dev
//     （比對 host 為該網域本身或其子網域，供 Cloudflare Pages 預覽網址使用）
export function makeCorsOrigin(patterns) {
  const exact = new Set();
  const wildcardBases = [];

  for (const p of patterns) {
    const m = p.match(/^https?:\/\/\*\.(.+)$/i);
    if (m) wildcardBases.push(m[1].toLowerCase());
    else exact.add(p);
  }

  return (origin, cb) => {
    // 非瀏覽器請求（curl、server 對 server）沒有 Origin，放行
    if (!origin) return cb(null, true);
    if (exact.has(origin)) return cb(null, true);

    let host;
    try {
      host = new URL(origin).host.toLowerCase();
    } catch {
      return cb(null, false);
    }
    const ok = wildcardBases.some((base) => host === base || host.endsWith(`.${base}`));
    cb(null, ok);
  };
}
