import axios from 'axios';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
});

adminApi.interceptors.request.use((config) => {
  const token = useAdminAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAdminAuthStore.getState().logout();
    return Promise.reject(err);
  },
);
