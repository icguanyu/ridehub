import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDriverBookings(driverId, { status, month, page = 1, pageSize = 20 } = {}) {
  return useQuery({
    queryKey: ['bookings', driverId, { status, month, page, pageSize }],
    enabled: Boolean(driverId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driverId}/bookings`, {
        params: { status, month, page, pageSize },
      });
      return data; // { bookings, pagination }
    },
  });
}

function useRespond(action) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const { data } = await api.put(
        `/bookings/${bookingId}/${action}`,
        action === 'reject' ? { reason: reason || undefined } : undefined,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export const useAcceptBooking = () => useRespond('accept');
export const useRejectBooking = () => useRespond('reject');
export const useCompleteBooking = () => useRespond('complete');

// 司機重新報價
export function useQuoteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, price, note }) => {
      const { data } = await api.put(`/bookings/${bookingId}/quote`, {
        price,
        note: note || undefined,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
