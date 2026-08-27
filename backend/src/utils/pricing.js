// 預估車資：base_price + price_per_km × 距離(km)
// MVP 無地圖，距離由客人選填；未填則只計基礎價。
export function estimatePrice(driver, { estimatedDistanceKm = 0 } = {}) {
  const base = Number(driver.base_price ?? 0);
  const perKm = Number(driver.price_per_km ?? 0);
  const distanceFee = perKm * Number(estimatedDistanceKm || 0);
  const total = base + distanceFee;
  return {
    basePrice: Math.round(base),
    distanceFee: Math.round(distanceFee),
    estimatedPrice: Math.round(total),
  };
}
