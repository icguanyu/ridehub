// DB bookings 列 → API 物件。
import { agreedPrice } from '../utils/pricing.js';

const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

export function bookingItem(row) {
  return {
    id: row.id,
    driverId: row.driver_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerLineId: row.customer_line_id,
    tripType: row.trip_type,
    pickupLocation: row.pickup_location,
    destination: row.destination,
    bookingDate: row.booking_date,
    bookingTime: hhmm(row.booking_time),
    returnDate: row.return_date,
    returnTime: hhmm(row.return_time),
    passengerCount: row.passenger_count,
    specialRequests: row.special_requests,
    estimatedPrice: row.estimated_price,
    quotedPrice: row.quoted_price,
    quotedAt: row.quoted_at,
    quoteNote: row.quote_note,
    agreedPrice: agreedPrice(row),
    status: row.status,
    rejectedReason: row.rejected_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

// 建立成功後回給客人的精簡物件
export function bookingCreated(row) {
  return {
    id: row.id,
    status: row.status,
    tripType: row.trip_type,
    estimatedPrice: row.estimated_price,
  };
}

// 手機搜尋結果：精簡欄位，不含敏感聯絡資訊
export function bookingSearchItem(row, statusToken) {
  return {
    id: row.id,
    status: row.status,
    tripType: row.trip_type,
    pickupLocation: row.pickup_location,
    destination: row.destination,
    bookingDate: row.booking_date,
    bookingTime: hhmm(row.booking_time),
    driverName: row.drivers?.name ?? null,
    statusToken,
  };
}

// 客人查詢狀態：預約 + 司機聯絡資訊（driver 已 join）
export function bookingWithDriver(row) {
  const d = row.drivers || {};
  const revealDriver = row.status === 'accepted';
  return {
    id: row.id,
    status: row.status,
    tripType: row.trip_type,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    pickupLocation: row.pickup_location,
    destination: row.destination,
    bookingDate: row.booking_date,
    bookingTime: hhmm(row.booking_time),
    returnDate: row.return_date,
    returnTime: hhmm(row.return_time),
    passengerCount: row.passenger_count,
    specialRequests: row.special_requests,
    estimatedPrice: row.estimated_price,
    quotedPrice: row.quoted_price,
    quoteNote: row.quote_note,
    quotedAt: row.quoted_at,
    agreedPrice: agreedPrice(row),
    rejectedReason: row.rejected_reason,
    driverName: d.name ?? null,
    driverPhone: revealDriver ? d.phone ?? null : null,
    driverLineDisplayId: revealDriver ? d.line_display_id ?? null : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
