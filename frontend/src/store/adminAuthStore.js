import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// superadmin 登入狀態（與司機的 authStore 分開）
export const useAdminAuthStore = create(
  persist(
    (set) => ({
      token: null,
      email: null,
      setAuth: ({ token, email }) => set({ token, email }),
      logout: () => set({ token: null, email: null }),
    }),
    { name: 'ridehub-admin' },
  ),
);
