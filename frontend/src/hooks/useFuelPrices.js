import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// 台灣參考油價（NT$/L）。{ prices: {gasoline_95,...}, source, updatedAt }
export function useFuelPrices() {
  return useQuery({
    queryKey: ['fuel-prices'],
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get('/fuel-prices');
      return data;
    },
  });
}
