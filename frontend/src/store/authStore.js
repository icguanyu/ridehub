import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 司機登入狀態；persist 到 localStorage
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      driver: null,

      setAuth: ({ token, driver }) => set({ token, driver }),
      updateDriver: (driver) => set({ driver }),
      logout: () => set({ token: null, driver: null }),
    }),
    { name: 'ridehub-auth' },
  ),
);

export const isLoggedIn = () => Boolean(useAuthStore.getState().token);
