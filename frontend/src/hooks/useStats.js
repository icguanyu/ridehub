import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDriverStats(driverId, month) {
  return useQuery({
    queryKey: ['stats', driverId, month ?? 'current'],
    enabled: Boolean(driverId),
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driverId}/stats`, {
        params: month ? { month } : undefined,
      });
      return data;
    },
  });
}
