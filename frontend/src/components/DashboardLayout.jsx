import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const tabs = [
  { to: '/dashboard', label: '總覽', end: true },
  { to: '/dashboard/bookings', label: '預約' },
  { to: '/dashboard/edit', label: '服務資訊' },
  { to: '/dashboard/availability', label: '時間設定' },
];

export default function DashboardLayout() {
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-16">
      <header className="flex items-center justify-between py-4">
        <div>
          <div className="text-lg font-bold text-brand-600">RideHub</div>
          <div className="text-xs text-slate-500">{driver?.name} 司機後台</div>
        </div>
        <button
          className="btn-ghost"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          登出
        </button>
      </header>

      <nav className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
                isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
