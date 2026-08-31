// 能耗估算（僅供參考）。與後端 utils/pricing.js estimateEnergyCost 對齊。

export const ENERGY_TYPE_OPTIONS = [
  { value: 'gasoline_92', label: '92 無鉛汽油' },
  { value: 'gasoline_95', label: '95 無鉛汽油' },
  { value: 'gasoline_98', label: '98 無鉛汽油' },
  { value: 'diesel', label: '柴油' },
  { value: 'ev', label: '電動車' },
];

export function energyFieldLabels(type) {
  return type === 'ev'
    ? { consumption: '耗電（kWh / 100km）', unitPrice: '電價（NT$ / 度）' }
    : { consumption: '油耗（km / L）', unitPrice: '油價（NT$ / L）' };
}

// distance / consumption / unitPrice 任一缺 → null
export function estimateEnergyCost({ energyType, consumption, unitPrice, distanceKm, tripType }) {
  const km = Number(distanceKm);
  const c = Number(consumption);
  const p = Number(unitPrice);
  if (!(km > 0) || !(c > 0) || !(p > 0)) return null;
  const totalKm = km * (tripType === 'round_trip' ? 2 : 1);
  const units = energyType === 'ev' ? (totalKm * c) / 100 : totalKm / c;
  return Math.round(units * p);
}
