// Google Distance Matrix：上車/目的地文字 → 開車距離。
// 未設 key、查不到、或任何錯誤 → 回 null（不擋主流程）。結果快取於 distance_cache。
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const DM_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const cacheKey = (o, d) => `${norm(o)}||${norm(d)}`;

async function fromCache(key) {
  const { data } = await supabaseAdmin
    .from('distance_cache')
    .select('distance_km, duration_min')
    .eq('key', key)
    .maybeSingle();
  return data ?? null;
}

async function toCache(key, distanceKm, durationMin) {
  const { error } = await supabaseAdmin
    .from('distance_cache')
    .upsert({ key, distance_km: distanceKm, duration_min: durationMin });
  if (error) logger.warn('寫入 distance_cache 失敗', error.message);
}

// 回傳 { distanceKm, durationMin } 或 null
export async function getDrivingDistance(origin, destination) {
  if (!config.googleMapsApiKey || !norm(origin) || !norm(destination)) return null;
  const key = cacheKey(origin, destination);

  const cached = await fromCache(key).catch(() => null);
  if (cached) {
    return cached.distance_km == null
      ? null
      : { distanceKm: Number(cached.distance_km), durationMin: cached.duration_min ?? null };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const url =
      `${DM_URL}?origins=${encodeURIComponent(origin)}` +
      `&destinations=${encodeURIComponent(destination)}` +
      `&mode=driving&region=tw&language=zh-TW&key=${config.googleMapsApiKey}`;
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    const el = json?.rows?.[0]?.elements?.[0];

    if (json?.status !== 'OK' || el?.status !== 'OK' || !(el.distance?.value > 0)) {
      if (json?.status && json.status !== 'OK') {
        logger.warn('Distance Matrix 回傳非 OK', json.status, json.error_message ?? '');
      }
      await toCache(key, null, null).catch(() => {}); // 負快取
      return null;
    }

    const distanceKm = Math.round((el.distance.value / 1000) * 10) / 10;
    const durationMin = el.duration?.value ? Math.round(el.duration.value / 60) : null;
    await toCache(key, distanceKm, durationMin).catch(() => {});
    return { distanceKm, durationMin };
  } catch (err) {
    logger.warn('Distance Matrix 例外', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
