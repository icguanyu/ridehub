// 產生 LINE 加好友連結。
// @ 開頭 → 官方帳號；其餘 → 個人 ID（客人填的通常是這種）。
// 可用性取決於對方是否設定 ID 且允許被搜尋。
export function lineAddFriendUrl(id) {
  const v = String(id ?? '').trim();
  if (!v) return null;
  return v.startsWith('@')
    ? `https://line.me/R/ti/p/${encodeURIComponent(v)}`
    : `https://line.me/ti/p/~${encodeURIComponent(v)}`;
}
