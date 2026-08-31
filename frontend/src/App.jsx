import { useEffect } from 'react';
import { Route, Routes, Outlet, useLocation, Link } from 'react-router-dom';
import { Center, Stack, Box } from '@mantine/core';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import SiteFooter from '@/components/SiteFooter';
import Wordmark from '@/components/Wordmark';

import DriverLogin from '@/pages/auth/DriverLogin';
import DriverSignup from '@/pages/auth/DriverSignup';
import DriverDashboard from '@/pages/DriverDashboard';
import DriverEdit from '@/pages/DriverEdit';
import DriverAvailability from '@/pages/DriverAvailability';
import BookingList from '@/pages/BookingList';
import BookingDetail from '@/pages/BookingDetail';
import DriverPublic from '@/pages/DriverPublic';
import CustomerBooking from '@/pages/CustomerBooking';
import BookingConfirmation from '@/pages/BookingConfirmation';
import HomePage from '@/pages/HomePage';
import MyBookings from '@/pages/MyBookings';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import Disclaimer from '@/pages/legal/Disclaimer';
import NotFound from '@/pages/NotFound';

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
          <Route path="bookings/:bookingId" element={<BookingDetail />} />
          <Route path="edit" element={<DriverEdit />} />
          <Route path="availability" element={<DriverAvailability />} />
        </Route>
      </Routes>
    </>
  );
}
