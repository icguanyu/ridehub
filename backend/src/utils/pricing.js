import { TRIP_TYPE } from '../constants.js';

// 預估車資：單程 = base_price + price_per_km × 距離；往返再 × 2。
// MVP 無地圖，距離由客人選填；未填則只計基礎價。
export function estimatePrice(driver, { estimatedDistanceKm = 0, tripType = TRIP_TYPE.ONE_WAY } = {}) {
  const base = Number(driver.base_price ?? 0);
  const perKm = Number(driver.price_per_km ?? 0);
  const oneWay = base + perKm * Number(estimatedDistanceKm || 0);
  const multiplier = tripType === TRIP_TYPE.ROUND_TRIP ? 2 : 1;
  const total = oneWay * multiplier;
  return {
    oneWayPrice: Math.round(oneWay),
    estimatedPrice: Math.round(total),
  };
}

// 成交價：司機有重新報價就用報價，否則用基礎報價
export function agreedPrice(booking) {
  const q = booking.quoted_price;
  return q === null || q === undefined ? booking.estimated_price : Number(q);
}

// 能耗成本估算（僅供參考）。距離 / 效率 / 單價任一缺就回 null。
// 油車：效率 = km/L；電車（energy_type='ev'）：效率 = kWh/100km。
// unitPrice 由呼叫端解析（司機自填 or 即時油價），未給則用 driver.energy_unit_price。
export function estimateEnergyCost(driver, { distanceKm, tripType = TRIP_TYPE.ONE_WAY, unitPrice } = {}) {
  const km = Number(distanceKm);
  const consumption = Number(driver.energy_consumption);
  const price = Number(unitPrice ?? driver.energy_unit_price);
  if (!(km > 0) || !(consumption > 0) || !(price > 0)) return null;

  const totalKm = km * (tripType === TRIP_TYPE.ROUND_TRIP ? 2 : 1);
  const units = driver.energy_type === 'ev' ? (totalKm * consumption) / 100 : totalKm / consumption;

  return Math.round(units * price);
}
