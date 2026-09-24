import { useEffect } from 'react';
import { Route, Routes, Outlet, useLocation, Link } from 'react-router-dom';
import { Center, Stack, Box } from '@mantine/core';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import DashboardLayout from '@/components/DashboardLayout';
import SiteFooter from '@/components/SiteFooter';
import Wordmark from '@/components/Wordmark';

import DriverLogin from '@/pages/auth/DriverLogin';
import DriverSignup from '@/pages/auth/DriverSignup';

// 忘記密碼功能暫時隱藏（需自訂網域 + SMTP 才能真的寄信）。
// 重新啟用：還原這兩個 lazy import、下方兩條 Route、以及 DriverLogin 的「忘記密碼？」連結。
// import { lazy, Suspense } from 'react';  // 記得把 useEffect 那行改回來
// const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
// const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
import DriverDashboard from '@/pages/DriverDashboard';
import DriverEdit from '@/pages/DriverEdit';
import BookingList from '@/pages/BookingList';
import BookingDetail from '@/pages/BookingDetail';
import NewBooking from '@/pages/NewBooking';
import DriverStats from '@/pages/DriverStats';
import DriverPublic from '@/pages/DriverPublic';
import CustomerBooking from '@/pages/CustomerBooking';
import BookingConfirmation from '@/pages/BookingConfirmation';
import HomePage from '@/pages/HomePage';
import MyBookings from '@/pages/MyBookings';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import Disclaimer from '@/pages/legal/Disclaimer';
import NotFound from '@/pages/NotFound';

import AdminLayout from '@/pages/admin/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminDrivers from '@/pages/admin/AdminDrivers';
import AdminDriverDetail from '@/pages/admin/AdminDriverDetail';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminVerifications from '@/pages/admin/AdminVerifications';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function CenteredPage({ children }) {
  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={380}>
        <Stack gap="lg" align="center">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Wordmark size={32} withMark markSize={40} slogan />
          </Link>
          <Box w="100%">{children}</Box>
        </Stack>
      </Box>
    </Center>
  );
}

// 公開頁面共用外框：內容 + 全站底部法律連結
function PublicLayout() {
  return (
    <>
      <Outlet />
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<CenteredPage><DriverLogin /></CenteredPage>} />
          <Route path="/signup" element={<CenteredPage><DriverSignup /></CenteredPage>} />
          {/* 忘記密碼暫時隱藏 —— 需網域 + SMTP 才能寄信
          <Route
            path="/forgot-password"
            element={
              <CenteredPage>
                <Suspense fallback={<Center py="xl"><Loader size="sm" /></Center>}>
                  <ForgotPassword />
                </Suspense>
              </CenteredPage>
            }
          />
          <Route
            path="/reset-password"
            element={
              <CenteredPage>
                <Suspense fallback={<Center py="xl"><Loader size="sm" /></Center>}>
                  <ResetPassword />
                </Suspense>
              </CenteredPage>
            }
          />
          */}

          {/* 客人端（無需登入）*/}
          <Route path="/driver/:driverId" element={<DriverPublic />} />
          <Route path="/driver/:driverId/book" element={<CustomerBooking />} />
          <Route path="/booking/:bookingId" element={<BookingConfirmation />} />

          <Route path="/my-bookings" element={<MyBookings />} />

          {/* 法律頁 */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DriverDashboard />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="bookings/new" element={<NewBooking />} />
          <Route path="bookings/:bookingId" element={<BookingDetail />} />
          <Route path="stats" element={<DriverStats />} />
          <Route path="edit" element={<DriverEdit />} />
        </Route>

        {/* superadmin 後台 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="drivers/:driverId" element={<AdminDriverDetail />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="verifications" element={<AdminVerifications />} />
        </Route>
      </Routes>
    </>
  );
}
