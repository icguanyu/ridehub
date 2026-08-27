// DB bookings 列 → API 物件。

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
    bookingTime: row.booking_time,
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
