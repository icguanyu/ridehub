import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePublicDriver(driverId) {
  return useQuery({
    queryKey: ['public-driver', driverId],
    enabled: Boolean(driverId),
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driverId}/public`);
      return data;
    },
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/bookings', payload);
      return data.booking; // { id, status, estimatedPrice, statusToken, message }
    },
  });
}

export function useBookingStatus(bookingId, token) {
  return useQuery({
    queryKey: ['booking-status', bookingId, token],
    enabled: Boolean(bookingId && token),
    refetchInterval: (q) =>
      q.state.data?.status === 'pending' ? 15_000 : false, // pending 時每 15s 自動刷新
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`, { params: { token } });
      return data.booking;
    },
  });
}
