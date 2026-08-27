import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      ['pending', 'quoted'].includes(q.state.data?.status) ? 15_000 : false, // 未定案時每 15s 自動刷新
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`, { params: { token } });
      return data.booking;
    },
  });
}

// 客人回應司機報價（accept / decline）
export function useRespondToQuote(bookingId, token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accept) => {
      const { data } = await api.put(
        `/bookings/${bookingId}/quote/${accept ? 'accept' : 'decline'}`,
        undefined,
        { params: { token } },
      );
      return data.booking;
    },
    onSuccess: (booking) => {
      qc.setQueryData(['booking-status', bookingId, token], booking);
    },
  });
}
