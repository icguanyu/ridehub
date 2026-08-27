import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/drivers/auth/login', payload);
      return data; // { driver, token, supabase }
    },
    onSuccess: (data) => setAuth({ token: data.token, driver: data.driver }),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/drivers/auth/register', payload);
      return data; // { driver: {id,name,phone}, token }
    },
    onSuccess: (data) => setAuth({ token: data.token, driver: data.driver }),
  });
}

export function useCurrentDriverId() {
  return useAuthStore((s) => s.driver?.id ?? null);
}
