// 把 DB 的 snake_case 欄位轉成 API 的 camelCase。
import { avatarPublicUrl } from '../services/storageService.js';

export function driverSummary(row) {
  return { id: row.id, name: row.name, phone: row.phone };
}

export function driverPrivate(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    avatarUrl: avatarPublicUrl(row.avatar_path),
    lineId: row.line_id,
    serviceDescription: row.service_description,
    serviceAreas: row.service_areas,
    carType: row.car_type,
    carPlate: row.car_plate,
    basePrice: row.base_price,
    pricePerKm: row.price_per_km,
    lineDisplayId: row.line_display_id ?? null,
    maxDailyBookings: row.max_daily_bookings,
    maxPassengers: row.max_passengers,
    passengerInsuranceWan: row.passenger_insurance_wan ?? null,
    energyType: row.energy_type ?? null,
    energyConsumption: row.energy_consumption ?? null,
    energyUnitPrice: row.energy_unit_price ?? null,
    isVerified: row.is_verified,
    suspendedAt: row.suspended_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 客人看得到的公開資訊（司機專屬頁面用）
export function driverPublic(row) {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: avatarPublicUrl(row.avatar_path),
    serviceDescription: row.service_description,
    serviceAreas: row.service_areas,
    carType: row.car_type,
    carPlate: row.car_plate,
    basePrice: row.base_price,
    pricePerKm: row.price_per_km,
    maxPassengers: row.max_passengers,
    passengerInsuranceWan: row.passenger_insurance_wan ?? null,
    isVerified: row.is_verified,
  };
}
