import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export function useAdminLogin() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await adminApi.post('/admin/auth/login', payload);
      return data; // { token, email }
    },
    onSuccess: (data) => setAuth(data),
  });
}

export function useAdminOverview(month) {
  return useQuery({
    queryKey: ['admin', 'overview', month ?? 'current'],
    queryFn: async () => (await adminApi.get('/admin/overview', { params: month ? { month } : undefined })).data,
  });
}

export function useAdminDrivers({ search, page }) {
  return useQuery({
    queryKey: ['admin', 'drivers', { search: search || '', page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (await adminApi.get('/admin/drivers', { params: { search: search || undefined, page } })).data,
  });
}

export function useAdminDriver(driverId) {
  return useQuery({
    queryKey: ['admin', 'driver', driverId],
    enabled: Boolean(driverId),
    queryFn: async () => (await adminApi.get(`/admin/drivers/${driverId}`)).data,
  });
}

export function useAdminBookings({ status, driverId, month, page }) {
  return useQuery({
    queryKey: ['admin', 'bookings', { status: status || '', driverId: driverId || '', month: month || '', page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await adminApi.get('/admin/bookings', {
          params: {
            status: status || undefined,
            driverId: driverId || undefined,
            month: month || undefined,
            page,
          },
        })
      ).data,
  });
}

export function useAdminSetVerified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, verified }) =>
      (await adminApi.put(`/admin/drivers/${driverId}/verify`, { verified })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminSetSuspended() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, suspended, reason }) =>
      (await adminApi.put(`/admin/drivers/${driverId}/suspend`, { suspended, reason: reason || undefined })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}
