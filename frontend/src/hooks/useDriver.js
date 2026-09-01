import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useDriver(driverId) {
  return useQuery({
    queryKey: ['driver', driverId],
    enabled: Boolean(driverId),
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driverId}`);
      return data;
    },
  });
}

export function useUpdateDriver(driverId) {
  const qc = useQueryClient();
  const updateDriver = useAuthStore((s) => s.updateDriver);
  return useMutation({
    mutationFn: async (patch) => {
      const { data } = await api.put(`/drivers/${driverId}`, patch);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['driver', driverId], data);
      updateDriver({ id: data.id, name: data.name, phone: data.phone });
    },
  });
}

export function useUpdateAvatar(driverId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.put(`/drivers/${driverId}/avatar`, fd);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['driver', driverId], data);
      qc.invalidateQueries({ queryKey: ['public-driver', driverId] });
    },
  });
}

export function useDeleteAvatar(driverId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/drivers/${driverId}/avatar`);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['driver', driverId], data);
      qc.invalidateQueries({ queryKey: ['public-driver', driverId] });
    },
  });
}

export function useBindLine(driverId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lineId) => {
      const { data } = await api.post(`/drivers/${driverId}/bind-line`, { lineId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver', driverId] }),
  });
}

export function useCreateLineLinkCode(driverId) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/drivers/${driverId}/line/link-code`);
      return data; // { code, expiresAt, ttlMinutes, addFriendUrl, instructions }
    },
  });
}

// 依上車/目的地自動估算開車距離
export function useDistancePreview(driverId) {
  return useMutation({
    mutationFn: async ({ origin, destination }) => {
      const { data } = await api.post(`/drivers/${driverId}/distance`, { origin, destination });
      return data; // { distanceKm, durationMin }
    },
  });
}

export function useAvailability(driverId) {
  return useQuery({
    queryKey: ['availability', driverId],
    enabled: Boolean(driverId),
    queryFn: async () => {
      const { data } = await api.get(`/drivers/${driverId}/availability`);
      return data;
    },
  });
}

export function useUpdateAvailability(driverId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => {
      const { data } = await api.put(`/drivers/${driverId}/availability`, patch);
      return data;
    },
    onSuccess: (data) => qc.setQueryData(['availability', driverId], data),
  });
}
