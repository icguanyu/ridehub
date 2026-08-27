import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
});

// 附上司機登入 token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → 清除登入狀態
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

// 把後端錯誤格式 { error: { message, details } } 轉成好用的訊息
export function apiErrorMessage(err, fallback = '發生錯誤，請稍後再試') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}
