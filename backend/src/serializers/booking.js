// DB bookings 列 → API 物件。

const hhmm = (t) => (t ? String(t).slice(0, 5) : null);

export function bookingItem(row) {
  return {
    id: row.id,
    driverId: row.driver_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerLineId: row.customer_line_id,
    pickupLocation: row.pickup_location,
    destination: row.destination,
    bookingDate: row.booking_date,
    bookingTime: hhmm(row.booking_time),
    passengerCount: row.passenger_count,
    specialRequests: row.special_requests,
    estimatedPrice: row.estimated_price,
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
    estimatedPrice: row.estimated_price,
  };
}

// 客人查詢狀態：預約 + 司機聯絡資訊（driver 已 join）
export function bookingWithDriver(row) {
  const d = row.drivers || {};
  return {
    id: row.id,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    pickupLocation: row.pickup_location,
    destination: row.destination,
    bookingDate: row.booking_date,
    bookingTime: hhmm(row.booking_time),
    passengerCount: row.passenger_count,
    specialRequests: row.special_requests,
    estimatedPrice: row.estimated_price,
    rejectedReason: row.rejected_reason,
    driverName: d.name ?? null,
    // 只有司機已接受時才揭露聯絡方式
    driverPhone: row.status === 'accepted' ? d.phone ?? null : null,
    driverLineId: row.status === 'accepted' ? d.line_id ?? null : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
